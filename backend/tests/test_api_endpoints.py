"""Integration tests for API endpoints.

Uses FastAPI TestClient with the database session overridden to the test
session, so all endpoint logic runs against the test database without
spinning up a real server. Covers:
  - US-09: POST /upload-sales, POST /upload-inventory
  - US-11: GET /api/inventory/alerts
  - US-12: GET /api/predictions/status
  - US-13: GET /api/predictions/metrics
  - US-15: GET /api/sales, GET /api/sales/range
  - US-17: GET /api/demand-alerts
  - US-20: GET /api/logs/uploads, GET /api/logs/model-executions
"""

import pytest
from datetime import date, timedelta

from database.models import (
    Company,
    DataSource,
    InventorySnapshot,
    ModelExecutionLog,
    ModelMetrics,
    Prediction,
    SalesTransaction,
    UploadLog,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _seed_company(db) -> Company:
    company = Company(name="Test Co")
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


# ---------------------------------------------------------------------------
# US-09 — Update Historical Data
# ---------------------------------------------------------------------------

_VALID_SALES_CSV = (
    b"item_id,date,units_sold,sell_price\n"
    b"SKU-001,2024-01-01,10,5.0\n"
    b"SKU-001,2024-01-02,12,5.0\n"
)


def test_upload_sales_valid_csv_stores_rows(client, monkeypatch):
    """Happy path: valid CSV is uploaded → 200 OK and rows_saved matches the file."""
    monkeypatch.setattr("api.main.run_prophet_background", lambda *a, **kw: None)

    response = client.post(
        "/upload-sales",
        files={"file": ("sales.csv", _VALID_SALES_CSV, "text/csv")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["rows_saved"] == 2
    assert data["filename"] == "sales.csv"


def test_upload_sales_unsupported_format_returns_400(client):
    """Alt path: file with unsupported extension → 400 with descriptive error."""
    response = client.post(
        "/upload-sales",
        files={"file": ("sales.txt", b"item_id,date\nA,2024-01-01\n", "text/plain")},
    )

    assert response.status_code == 400
    assert "Unsupported format" in response.json()["detail"]


_VALID_INVENTORY_CSV = (
    b"item_id,date,store_id,inventory_on_hand,lead_time_days,unit_cost\n"
    b"SKU-001,2024-01-01,S1,100,10,5.0\n"
)


def test_upload_inventory_valid_csv_stores_rows(client):
    """Happy path: valid inventory CSV is uploaded → 200 OK and rows_saved matches the file."""
    response = client.post(
        "/upload-inventory",
        files={"file": ("inventory.csv", _VALID_INVENTORY_CSV, "text/csv")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["rows_saved"] == 1
    assert data["filename"] == "inventory.csv"


def test_upload_inventory_unsupported_format_returns_400(client):
    """Alt path: file with unsupported extension → 400 with descriptive error."""
    response = client.post(
        "/upload-inventory",
        files={"file": ("inventory.txt", b"item_id,date\nA,2024-01-01\n", "text/plain")},
    )

    assert response.status_code == 400
    assert "Unsupported format" in response.json()["detail"]


# ---------------------------------------------------------------------------
# US-11 — Stockout Alerts & Risk Identification
# ---------------------------------------------------------------------------

def test_get_alerts_no_inventory_returns_empty(client):
    """Alt path: no inventory data → empty alert list with alert_mode 'no_data'."""
    response = client.get("/api/inventory/alerts")

    assert response.status_code == 200
    data = response.json()
    assert data["alerts"] == []
    assert data["alert_mode"] == "no_data"


def test_get_alerts_critical_sku_appears_first(client, db):
    """Happy path: SKU where stock < demand during lead time is classified
    as 'critical' and returned as the first alert."""
    company = _seed_company(db)

    # stock=5, lead_time=10 days, forecast=10 units/day → need 100, have 5 → critical
    db.add(InventorySnapshot(
        company_id=company.id,
        item_id="CRIT-SKU",
        store_id="S1",
        date=date(2017, 1, 1),
        inventory_on_hand=5,
        inventory_available=5,
        lead_time_days=10,
        unit_cost=10.0,
    ))
    db.commit()

    forecast_start = date(2017, 1, 2)
    for i in range(90):
        db.add(Prediction(
            company_id=company.id,
            item_id="CRIT-SKU",
            forecast_date=forecast_start + timedelta(days=i),
            predicted_demand=10.0,
            yhat_lower=8.0,
            yhat_upper=12.0,
        ))
    db.commit()

    response = client.get("/api/inventory/alerts")

    assert response.status_code == 200
    data = response.json()
    assert len(data["alerts"]) >= 1
    first = data["alerts"][0]
    assert first["stock_status"] == "critical"
    assert first["item_id"] == "CRIT-SKU"


# ---------------------------------------------------------------------------
# US-12 — Automatic Prediction Refresh
# ---------------------------------------------------------------------------

def test_get_status_no_datasource_returns_no_data(client):
    """Alt path: no files uploaded yet → status is 'no_data'."""
    response = client.get("/api/predictions/status")

    assert response.status_code == 200
    assert response.json()["status"] == "no_data"


def test_get_status_ready_returns_timestamp(client, db):
    """Happy path: datasource in 'ready' state and at least one Prediction →
    response includes status='ready' and a non-null last_run_at."""
    company = _seed_company(db)

    db.add(DataSource(company_id=company.id, filename="sales.csv", status="ready"))
    db.add(Prediction(
        company_id=company.id,
        item_id="SKU-X",
        forecast_date=date(2017, 1, 1),
        predicted_demand=5.0,
        yhat_lower=4.0,
        yhat_upper=6.0,
    ))
    db.commit()

    response = client.get("/api/predictions/status")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["last_run_at"] is not None


# ---------------------------------------------------------------------------
# US-13 — Model Accuracy Metrics
# ---------------------------------------------------------------------------

def test_get_metrics_no_datasource_returns_404(client):
    """Alt path: no data uploaded → metrics endpoint returns 404."""
    response = client.get("/api/predictions/metrics")

    assert response.status_code == 404


def test_get_metrics_returns_aggregate_and_per_sku(client, db):
    """Happy path: metrics in DB → response has both aggregate and per_sku
    with correct numeric values."""
    company = _seed_company(db)

    db.add(DataSource(company_id=company.id, filename="sales.csv", status="ready"))
    db.add(ModelMetrics(
        company_id=company.id,
        item_id=None,          # aggregate row
        mae=2.5, rmse=3.1, mape=15.0, coverage_ic=0.85, bias=0.1,
        training_samples=300, validation_samples=30,
        seasonality_mode="multiplicative",
    ))
    db.add(ModelMetrics(
        company_id=company.id,
        item_id="SKU-X",
        mae=1.8, rmse=2.4, mape=12.0, coverage_ic=0.90, bias=-0.05,
        training_samples=100, validation_samples=10,
        seasonality_mode="multiplicative",
    ))
    db.commit()

    response = client.get("/api/predictions/metrics")

    assert response.status_code == 200
    data = response.json()
    assert data["aggregate"] is not None
    assert float(data["aggregate"]["mae"]) == pytest.approx(2.5, rel=0.01)
    assert len(data["per_sku"]) == 1
    assert data["per_sku"][0]["item_id"] == "SKU-X"


# ---------------------------------------------------------------------------
# US-15 — Sales View
# ---------------------------------------------------------------------------

def test_get_sales_returns_rows_when_data_exists(client, db):
    """Happy path: sales data in DB → rows returned with correct item_id and units_sold."""
    company = _seed_company(db)
    db.add(SalesTransaction(
        company_id=company.id,
        item_id="FOODS_001",
        date=date(2017, 1, 1),
        units_sold=10,
        sell_price=5.0,
    ))
    db.commit()

    response = client.get("/api/sales")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["item_id"] == "FOODS_001"
    assert data[0]["units_sold"] == 10


def test_get_sales_no_data_returns_empty_list(client):
    """Alt path: no sales in DB → endpoint returns empty list, not 404."""
    response = client.get("/api/sales")

    assert response.status_code == 200
    assert response.json() == []


def test_get_sales_filters_by_item_id(client, db):
    """Happy path: item_id query param → only matching rows are returned."""
    company = _seed_company(db)
    for item in ["FOODS_001", "HOBBIES_001"]:
        db.add(SalesTransaction(
            company_id=company.id,
            item_id=item,
            date=date(2017, 1, 1),
            units_sold=5,
            sell_price=2.0,
        ))
    db.commit()

    response = client.get("/api/sales", params={"item_id": "FOODS_001"})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["item_id"] == "FOODS_001"


def test_get_sales_range_returns_min_max_dates(client, db):
    """Happy path: sales data exists → min_date and max_date match seeded data."""
    company = _seed_company(db)
    for d_val in [date(2017, 1, 1), date(2017, 6, 30)]:
        db.add(SalesTransaction(
            company_id=company.id,
            item_id="SKU-X",
            date=d_val,
            units_sold=1,
            sell_price=1.0,
        ))
    db.commit()

    response = client.get("/api/sales/range")

    assert response.status_code == 200
    data = response.json()
    assert data["min_date"] == "2017-01-01"
    assert data["max_date"] == "2017-06-30"


def test_get_sales_range_no_data_returns_404(client):
    """Alt path: no sales data in DB → /api/sales/range returns 404."""
    response = client.get("/api/sales/range")

    assert response.status_code == 404


# ---------------------------------------------------------------------------
# US-17 — Demand Prediction Alerts
# ---------------------------------------------------------------------------

def test_get_demand_alerts_no_sales_returns_empty(client):
    """Alt path: no sales data → alerts list is empty regardless of forecast."""
    response = client.get("/api/demand-alerts")

    assert response.status_code == 200
    assert response.json()["alerts"] == []


def test_get_demand_alerts_critical_sku_appears(client, db):
    """Happy path: SKU whose 30-day forecast avg is 50% above its 30-day
    historical avg appears with severity='critical' and direction='surge'."""
    company = _seed_company(db)

    # 31 days of historical sales at 2 units/day
    for i in range(31):
        db.add(SalesTransaction(
            company_id=company.id,
            item_id="SURGE-001",
            date=date(2017, 1, 1) + timedelta(days=i),
            units_sold=2,
            sell_price=5.0,
        ))

    # 30 days of forecast at 3 units/day → 50% above historical
    for i in range(30):
        db.add(Prediction(
            company_id=company.id,
            item_id="SURGE-001",
            forecast_date=date(2017, 2, 1) + timedelta(days=i),
            predicted_demand=3.0,
            yhat_lower=2.5,
            yhat_upper=3.5,
        ))
    db.commit()

    response = client.get("/api/demand-alerts")

    assert response.status_code == 200
    data = response.json()
    assert len(data["alerts"]) >= 1
    alert = next(a for a in data["alerts"] if a["item_id"] == "SURGE-001")
    assert alert["severity"] == "critical"
    assert alert["direction"] == "surge"
    assert float(alert["deviation_pct"]) == pytest.approx(50.0, rel=0.05)


def test_get_demand_alerts_low_deviation_sku_excluded(client, db):
    """Alt path: deviation < 25% threshold → SKU does not appear in alerts."""
    company = _seed_company(db)

    # historical avg = 2, forecast avg = 2.1 → 5% deviation → below threshold
    for i in range(31):
        db.add(SalesTransaction(
            company_id=company.id,
            item_id="STABLE-001",
            date=date(2017, 1, 1) + timedelta(days=i),
            units_sold=2,
            sell_price=5.0,
        ))
    for i in range(30):
        db.add(Prediction(
            company_id=company.id,
            item_id="STABLE-001",
            forecast_date=date(2017, 2, 1) + timedelta(days=i),
            predicted_demand=2.1,
            yhat_lower=1.9,
            yhat_upper=2.3,
        ))
    db.commit()

    response = client.get("/api/demand-alerts")

    assert response.status_code == 200
    data = response.json()
    assert all(a["item_id"] != "STABLE-001" for a in data["alerts"])


# ---------------------------------------------------------------------------
# US-20 — Audit Logs
# ---------------------------------------------------------------------------

def test_get_upload_logs_empty_when_no_records(client):
    """Alt path: no upload logs in DB → endpoint returns empty list."""
    response = client.get("/api/logs/uploads")

    assert response.status_code == 200
    assert response.json() == []


def test_get_upload_logs_returns_recorded_entries(client, db):
    """Happy path: upload log seeded in DB → returned with correct fields."""
    db.add(UploadLog(
        filename="sales_2017.csv",
        file_type="sales",
        status="success",
        records_processed=42,
    ))
    db.commit()

    response = client.get("/api/logs/uploads")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["filename"] == "sales_2017.csv"
    assert data[0]["file_type"] == "sales"
    assert data[0]["status"] == "success"
    assert data[0]["records_processed"] == 42


def test_get_model_execution_logs_empty_when_no_records(client):
    """Alt path: no model execution logs in DB → endpoint returns empty list."""
    response = client.get("/api/logs/model-executions")

    assert response.status_code == 200
    assert response.json() == []


def test_get_model_execution_logs_returns_recorded_entries(client, db):
    """Happy path: model execution log seeded in DB → returned with numeric metrics."""
    db.add(ModelExecutionLog(
        status="success",
        skus_trained=35,
        avg_mae=2.5,
        avg_rmse=3.1,
        avg_mape=15.0,
        avg_coverage_ic=0.85,
        duration_seconds=120.5,
    ))
    db.commit()

    response = client.get("/api/logs/model-executions")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["status"] == "success"
    assert data[0]["skus_trained"] == 35
    assert float(data[0]["avg_mape"]) == pytest.approx(15.0, rel=0.01)
