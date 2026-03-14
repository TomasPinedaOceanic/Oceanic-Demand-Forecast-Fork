import pandas as pd

from fastapi import FastAPI, File, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder

from sqlalchemy.orm import Session

from api.validation import validate_sales_dataframe, validate_inventory_dataframe
from api.dataframe_store import (
    save_dataframe,
    get_latest_dataset_id,
    load_dataframe,
)

from database.database import get_db
from database.models import Company, DataSource, SalesTransaction, Prediction, InventorySnapshot

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
# POST /upload-sales
# =============================================================================

@app.post(
    "/upload-sales",
    tags=["Ingestion"],
    summary="Upload sales CSV or Excel file",
    description="Accepts a .csv or .xlsx file, validates it, stores it in the database, and triggers the demand forecast pipeline.",
)
async def upload_sales(
    file: UploadFile = File(..., description="Sales file: .csv, .xlsx or .xls"),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    try:
        # Ensure company exists
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

        # Step 3: Save DataSource record
        data_source = DataSource(
            company_id=company_id,
            filename=file.filename,
            status="uploaded",
        )
        db.add(data_source)
        db.commit()
        db.refresh(data_source)

        # Step 4: Delete existing sales transactions for this company
        db.query(SalesTransaction).filter(SalesTransaction.company_id == company_id).delete()
        db.commit()

        # Step 5: Save rows to sales_transaction table
        transactions = [
            SalesTransaction(
                company_id=company_id,
                item_id=str(row["item_id"]).strip(),
                store_id=str(row["store_id"]).strip() if pd.notna(row.get("store_id")) else None,
                cat_id=str(row["cat_id"]).strip() if pd.notna(row.get("cat_id")) else None,
                dept_id=str(row["dept_id"]).strip() if pd.notna(row.get("dept_id")) else None,
                date=row["date"].date(),
                units_sold=int(row["units_sold"]),
                sell_price=float(row["sell_price"]) if pd.notna(row.get("sell_price")) else None,
                holiday_promotion=int(row["holiday_promotion"]) if pd.notna(row.get("holiday_promotion")) else None,
                event_name_1=str(row["event_name_1"]).strip() if pd.notna(row.get("event_name_1")) else None,
            )
            for _, row in dataframe.iterrows()
        ]

        db.bulk_save_objects(transactions)
        db.commit()

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Error processing dataset: {error}") from error

    return {
        "filename": file.filename,
        "rows_saved": len(transactions),
        "company_id": company_id,
        "data_source_id": data_source.id,
        "columns": [str(col) for col in dataframe.columns],
        "preview": dataframe.head(5).where(dataframe.notna(), other=None).to_dict(orient="records"),
        "validation": {
            "warnings": result.warnings,
            "issues_preview": result.issues[:20],
            "issues_count": len(result.issues),
        },
    }

# =============================================================================
# POST /upload-inventory
# =============================================================================

@app.post(
    "/upload-inventory",
    tags=["Ingestion"],
    summary="Upload inventory snapshot CSV or Excel file",
    description="Accepts a .csv or .xlsx file with current inventory levels per SKU and stores it in the database.",
)
async def upload_inventory(
    file: UploadFile = File(..., description="Inventory file: .csv, .xlsx or .xls"),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    try:
        # Ensure company exists
        company = db.query(Company).order_by(Company.id.asc()).first()
        if not company:
            company = Company(name="Oceanic Demo Company")
            db.add(company)
            db.commit()
            db.refresh(company)

        company_id = company.id

        # Step 1: Parse file
        dataframe = parse_uploaded_file(file)

        # Step 2: Validate and clean
        result = validate_inventory_dataframe(dataframe)
        dataframe = result.cleaned

        # Step 3: Delete existing snapshots for this company before inserting new ones
        db.query(InventorySnapshot).filter(InventorySnapshot.company_id == company_id).delete()
        db.commit()

        # Step 4: Save to inventory_snapshot table
        snapshots = [
            InventorySnapshot(
                company_id=company_id,
                date=row["date"].date(),
                item_id=str(row["item_id"]).strip(),
                store_id=str(row["store_id"]).strip() if pd.notna(row.get("store_id")) else None,
                inventory_on_hand=int(row["inventory_on_hand"]),
                inventory_available=int(row["inventory_available"]) if pd.notna(row["inventory_available"]) else None,
                lead_time_days=int(row["lead_time_days"]),
                unit_cost=float(row["unit_cost"]),
                reorder_quantity=int(row["reorder_quantity"]) if pd.notna(row.get("reorder_quantity")) else None,
            )
            for _, row in dataframe.iterrows()
        ]

        db.bulk_save_objects(snapshots)
        db.commit()

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Error processing inventory file: {error}") from error

    return {
        "filename": file.filename,
        "rows_saved": len(snapshots),
        "company_id": company_id,
        "skus": dataframe["item_id"].tolist(),
        "preview": dataframe.head(5).where(dataframe.notna(), other=None).to_dict(orient="records"),
        "validation": {
            "warnings": result.warnings,
            "issues_preview": result.issues[:20],
            "issues_count": len(result.issues),
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
    summary="Get current inventory by SKU",
    description="Returns current stock levels per SKU from the latest inventory snapshot.",
)
async def get_inventory(db: Session = Depends(get_db)):
    try:

        snapshots = (
            db.query(InventorySnapshot)
            .order_by(InventorySnapshot.item_id)
            .all()
        )

        if not snapshots:
            raise HTTPException(status_code=404, detail="No inventory data found. Please upload an inventory file first.")

        return {
            "items": [
                {
                    "item_id": s.item_id,
                    "store_id": s.store_id,
                    "current_stock": s.inventory_on_hand,
                    "available_stock": s.inventory_available if s.inventory_available is not None else s.inventory_on_hand,
                    "lead_time_days": s.lead_time_days,
                    "unit_cost": float(s.unit_cost),
                    "next_month_forecast": 0,    # Sprint 2
                    "stock_status": "TBD",       # Sprint 2
                    "last_updated": s.date.isoformat(),
                }
                for s in snapshots
            ]
        }

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