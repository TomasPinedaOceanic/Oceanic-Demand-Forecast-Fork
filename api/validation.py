from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import pandas as pd

@dataclass
class ValidationResult:
    cleaned: pd.DataFrame
    issues: List[Dict[str, Any]]
    warnings: List[str]

def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(c).strip().lower() for c in df.columns]
    return df

def validate_sales_dataframe(
    df: pd.DataFrame,
    date_col: str = "date",
    sku_col: str = "item_id",
    quantity_col: str = "units_sold",
    price_col: str = "sell_price",
    drop_invalid_rows: bool = True,
) -> ValidationResult:
    """
    Validates and cleans the uploaded sales dataframe.
    Required columns: date, item_id, units_sold, sell_price.
    All other columns are preserved but not validated.
    """
    required = [date_col, sku_col, quantity_col, price_col]

    df = _normalize_columns(df)

    # Check required columns exist
    missing_cols = [c for c in required if c not in df.columns]
    if missing_cols:
        raise ValueError(
            f"Missing required columns: {missing_cols}. "
            f"Received columns: {list(df.columns)}"
        )

    cleaned = df.copy()
    issues: List[Dict[str, Any]] = []
    warnings: List[str] = []

    # Convert types
    cleaned[date_col]     = pd.to_datetime(cleaned[date_col], errors="coerce")
    cleaned[quantity_col] = pd.to_numeric(cleaned[quantity_col], errors="coerce")
    cleaned[price_col]    = pd.to_numeric(cleaned[price_col], errors="coerce")

    # Detect invalid rows
    bad_date  = cleaned[date_col].isna()
    bad_sku   = cleaned[sku_col].isna() | (cleaned[sku_col].astype(str).str.strip() == "")
    bad_qty   = cleaned[quantity_col].isna()
    bad_price = cleaned[price_col].isna()

    bad_any = bad_date | bad_sku | bad_qty | bad_price

    if bad_any.any():
        for idx, row in cleaned.loc[bad_any].iterrows():
            reasons = []
            if pd.isna(row[date_col]):                                    reasons.append("invalid date")
            if pd.isna(row[sku_col]) or str(row[sku_col]).strip() == "": reasons.append("empty item_id")
            if pd.isna(row[quantity_col]):                                reasons.append("invalid units_sold")
            if pd.isna(row[price_col]):                                   reasons.append("invalid sell_price")
            issues.append({"row_index": int(idx), "reasons": reasons})

        warnings.append(f"{int(bad_any.sum())} rows with invalid data detected.")

        if drop_invalid_rows:
            cleaned = cleaned.loc[~bad_any].copy()
            warnings.append("Invalid rows dropped (drop_invalid_rows=True).")

    # Fill remaining nulls in numeric columns with 0
    cleaned[quantity_col] = cleaned[quantity_col].fillna(0)
    cleaned[price_col]    = cleaned[price_col].fillna(0)

    # Clean item_id
    cleaned[sku_col] = cleaned[sku_col].astype(str).str.strip()

    # Sort by item and date
    cleaned = cleaned.sort_values([sku_col, date_col]).reset_index(drop=True)

    return ValidationResult(cleaned=cleaned, issues=issues, warnings=warnings)