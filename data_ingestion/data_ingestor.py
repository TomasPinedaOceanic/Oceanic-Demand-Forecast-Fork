import pandas as pd

from fastapi import FastAPI, File, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder

from sqlalchemy.orm import Session

from data_ingestion.validation import validate_sales_dataframe
from data_ingestion.dataframe_store import (
    save_dataframe,
    get_latest_dataset_id,
    load_dataframe,
)

from database.database import get_db
from database.models import Company, DataSource, RawData, Prediction

app = FastAPI(title="Oceanic Demand Forecast API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Health Check
# =============================================================================

@app.get("/")
async def health_check():
    return {"message": "Oceanic Demand Forecast API is running"}

# =============================================================================
# POST /upload-file
# =============================================================================

@app.post(
    "/upload-file",
    tags=["Ingestion"],
    summary="Upload sales CSV or Excel file",
    description="Accepts a .csv or .xlsx file, validates it, stores it in the database, and triggers the demand forecast pipeline.",
)
async def upload_file(
    file: UploadFile = File(..., description="Sales file: .csv, .xlsx or .xls"),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    try:
        # Ensure a company exists — create demo company if none found
        company = db.query(Company).order_by(Company.id.asc()).first()
        if not company:
            company = Company(name="Oceanic Demo Company")
            db.add(company)
            db.commit()
            db.refresh(company)

        company_id = company.id

        # Step 1: Parse file into DataFrame
        dataframe = parse_uploaded_file(file)

        # Step 2: Validate and clean
        result = validate_sales_dataframe(dataframe)
        dataframe = result.cleaned

        # Step 3: Save Parquet artifact
        dataset_id, artifact_path = save_dataframe(file.filename, dataframe)

        # Step 4: Save DataSource record
        data_source = DataSource(
            company_id=company_id,
            filename=file.filename,
            status="uploaded",
        )
        db.add(data_source)
        db.commit()
        db.refresh(data_source)

        # Step 5: Save raw rows as JSONB — replace NaN with None for valid JSON
        records = dataframe.reset_index(drop=True).where(
            dataframe.notna(), other=None
        ).to_dict(orient="records")

        raw_objects = [
            RawData(
                company_id=company_id,
                data_source_id=data_source.id,
                row_number=i,
                data=jsonable_encoder(rec),
            )
            for i, rec in enumerate(records, start=1)
        ]

        db.bulk_save_objects(raw_objects)
        db.commit()

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Error processing dataset: {error}") from error

    return {
        "dataset_id": dataset_id,
        "artifact_path": artifact_path,
        "filename": file.filename,
        "content_type": file.content_type,
        "rows": int(len(dataframe)),
        "columns": [str(col) for col in dataframe.columns],
        "preview": dataframe.head(5).where(dataframe.notna(), other=None).to_dict(orient="records"),
        "validation": {
            "warnings": result.warnings,
            "issues_preview": result.issues[:20],
            "issues_count": len(result.issues),
        },
        "db": {
            "company_id": company_id,
            "company_name": company.name,
            "data_source_id": data_source.id,
            "raw_rows_saved": len(dataframe),
        },
    }

# =============================================================================
# GET /api/predictions
# =============================================================================

@app.get(
    "/api/predictions",
    tags=["Predictions"],
    summary="Get demand forecasts by SKU and date range",
    description="Returns Prophet forecast results. Optionally filter by item_id and/or date range.",
)
async def get_predictions(
    sku: str = None,
    date_from: str = None,
    date_to: str = None,
    db: Session = Depends(get_db),
):
    try:
        query = db.query(Prediction)

        if sku:
            query = query.filter(Prediction.item_id == sku)
        if date_from:
            query = query.filter(Prediction.forecast_date >= date_from)
        if date_to:
            query = query.filter(Prediction.forecast_date <= date_to)

        predictions = query.order_by(Prediction.item_id, Prediction.forecast_date).all()

        if not predictions:
            return []

        return [
            {
                "item_id": p.item_id,
                "date": p.forecast_date.isoformat(),
                "yhat": float(p.predicted_demand),
                "yhat_lower": float(p.yhat_lower),
                "yhat_upper": float(p.yhat_upper),
            }
            for p in predictions
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching predictions: {e}")

# =============================================================================
# GET /api/inventory
# =============================================================================

@app.get(
    "/api/inventory",
    tags=["Inventory"],
    summary="Get current inventory by SKU (Sprint 1 — from latest upload)",
    description="Returns last known units_sold per SKU from the most recent upload. Forecast-based stock status available in Sprint 2.",
)
async def get_inventory():
    try:
        dataset_id = get_latest_dataset_id()
        df = load_dataframe(dataset_id)
        df.columns = [str(c).strip().lower() for c in df.columns]

        required = ["item_id", "date", "units_sold"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Latest dataset is missing required columns for inventory: {missing}",
            )

        df["date"]       = pd.to_datetime(df["date"], errors="coerce")
        df["units_sold"] = pd.to_numeric(df["units_sold"], errors="coerce").fillna(0)
        df = df.dropna(subset=["date"])

        last_rows = (
            df.sort_values(["item_id", "date"])
              .groupby("item_id", as_index=False)
              .tail(1)
        )

        inventory = [
            {
                "item_id": row["item_id"],
                "current_stock": int(row["units_sold"]),
                "next_month_forecast": 0,
                "stock_status": "TBD",
                "last_updated": row["date"].date().isoformat(),
            }
            for _, row in last_rows.sort_values("item_id").iterrows()
        ]

        return {
            "dataset_id": dataset_id,
            "items": inventory,
        }

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching inventory: {e}")

# =============================================================================
# Helpers
# =============================================================================

def parse_uploaded_file(file: UploadFile) -> pd.DataFrame:
    filename = file.filename.lower()
    try:
        if filename.endswith(".csv"):
            return pd.read_csv(file.file)
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            return pd.read_excel(file.file)
        else:
            raise ValueError("Unsupported format. Use CSV or Excel (.xlsx, .xls)")
    except Exception as error:
        raise ValueError(f"Could not process file: {error}") from error