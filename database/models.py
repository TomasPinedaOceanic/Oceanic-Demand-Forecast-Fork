from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String, TIMESTAMP, text
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

class Product(Base):
    __tablename__ = "product"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("company.id"))
    sku = Column(String(100))
    name = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

class SalesTransaction(Base):
    __tablename__ = "sales_transaction"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("company.id"))
    product_id = Column(Integer, ForeignKey("product.id"))
    date = Column(Date)
    quantity = Column(Integer)
    total_amount = Column(Numeric(12, 2))
    # TODO: adapt to M5 schema in Sprint 2 — add item_id, units_sold, sell_price
    
class Prediction(Base):
    __tablename__ = "prediction"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("company.id"))
    product_id = Column(Integer, ForeignKey("product.id"), nullable=True)
    sku = Column(String(100), nullable=False)
    forecast_date = Column(Date, nullable=False)
    predicted_demand = Column(Numeric(12, 2))
    yhat_lower = Column(Numeric(12, 2))
    yhat_upper = Column(Numeric(12, 2))
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

class InventorySnapshot(Base):
    __tablename__ = "inventory_snapshot"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("company.id"))
    product_id = Column(Integer, ForeignKey("product.id"))
    date = Column(Date)
    stock = Column(Integer)