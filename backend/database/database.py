import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from .base import Base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def create_database_if_not_exists(url: str) -> None:
    """Creates the PostgreSQL database if it does not already exist."""
    base_url, db_name = url.rsplit("/", 1)
    default_engine = create_engine(f"{base_url}/postgres", isolation_level="AUTOCOMMIT")

    with default_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :db_name"),
            {"db_name": db_name}
        ).fetchone()

        if not exists:
            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
            print(f"Database '{db_name}' created.")

    default_engine.dispose()

create_database_if_not_exists(DATABASE_URL)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# Import models to ensure all tables are registered with Base
from . import models

def init_db() -> None:
    """Creates all tables defined in models if they do not already exist."""
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Tables detected in the database:")
    for table_name in tables:
        print(f"  - {table_name}")


def get_db():
    """Yields a database session and ensures it is closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if __name__ == "__main__":
    init_db()