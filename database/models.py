from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, Numeric, String, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import JSONB

from .base import Base

class Company(Base):
    __tablename__ = "company"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

class DataSource(Base):
    __tablename__ = "data_source"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("company.id"))
    filename = Column(String(255))
    upload_date = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    status = Column(String(50))

class RawData(Base):
    __tablename__ = "raw_data"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("company.id"))
    data_source_id = Column(Integer, ForeignKey("data_source.id"))
    row_number = Column(Integer)
    data = Column(JSONB)

class SalesTransaction(Base):
    __tablename__ = "sales_transaction"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("company.id"))
    item_id = Column(String(100), nullable=False)
    date = Column(Date)
    units_sold = Column(Integer)
    sell_price = Column(Numeric(12, 2))

class Prediction(Base):
    __tablename__ = "prediction"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("company.id"))
    item_id = Column(String(100), nullable=False)
    forecast_date = Column(Date, nullable=False)
    predicted_demand = Column(Numeric(12, 2))
    yhat_lower = Column(Numeric(12, 2))
    yhat_upper = Column(Numeric(12, 2))
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

class InventorySnapshot(Base):
    __tablename__ = "inventory_snapshot"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("company.id"))
    date = Column(Date, nullable=False)
    item_id = Column(String(100), nullable=False)
    store_id = Column(String(50))
    inventory_on_hand = Column(Integer, nullable=False)
    inventory_available = Column(Integer)         # optional — defaults to inventory_on_hand
    lead_time_days = Column(Integer, nullable=False)
    unit_cost = Column(Numeric(12, 2), nullable=False)
    reorder_quantity = Column(Integer)            # optional
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

class InventoryAnalysis(Base):
    __tablename__ = "inventory_analysis"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("company.id"))
    inventory_snapshot_id = Column(Integer, ForeignKey("inventory_snapshot.id"))
    item_id = Column(String(100), nullable=False)
    analysis_date = Column(Date, nullable=False)

    # FR-09 — Reorder point
    avg_daily_forecast = Column(Numeric(12, 2))
    safety_stock = Column(Numeric(12, 2))
    reorder_point = Column(Numeric(12, 2))

    # FR-10 — Stockout risk
    days_of_stock = Column(Numeric(12, 2))
    stockout_flag = Column(Boolean, default=False)
    stockout_date = Column(Date)

    # FR-11 — Slow-moving
    slow_moving_flag = Column(Boolean, default=False)
    immobilized_capital = Column(Numeric(12, 2))

    # FR-12 — Future projection (simple version Sprint 2, full time series Sprint 3)
    units_needed_next_month = Column(Numeric(12, 2))

    # Frontend alerts
    stock_status = Column(String(20))  # ok / low / critical

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))