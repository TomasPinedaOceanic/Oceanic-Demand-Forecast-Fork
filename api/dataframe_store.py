from pathlib import Path
from uuid import uuid4

import pandas as pd

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"
LATEST_DATASET_FILE = ARTIFACTS_DIR / "latest_dataset.txt"

def save_dataframe(filename: str, dataframe: pd.DataFrame) -> tuple[str, str]:
    """Saves DataFrame as Parquet artifact and updates the latest dataset reference."""
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    dataset_id = f"{Path(filename).stem}_{uuid4().hex[:8]}"
    artifact_path = ARTIFACTS_DIR / f"{dataset_id}.parquet"
    dataframe.to_parquet(artifact_path, index=False)

    # Store reference to the latest uploaded dataset
    LATEST_DATASET_FILE.write_text(dataset_id, encoding="utf-8")

    return dataset_id, str(artifact_path)

def load_dataframe(dataset_id: str) -> pd.DataFrame:
    """Loads a saved Parquet artifact by dataset ID."""
    artifact_path = ARTIFACTS_DIR / f"{dataset_id}.parquet"
    if not artifact_path.exists():
        raise FileNotFoundError(f"No saved dataset found with id '{dataset_id}'")
    return pd.read_parquet(artifact_path)

def get_latest_dataset_id() -> str:
    """Returns the ID of the most recently uploaded dataset.
    Allows inventory calculation from the latest upload without DB queries or volatile memory.
    """
    if not LATEST_DATASET_FILE.exists():
        raise FileNotFoundError("No uploads found. Please upload a file first.")
    return LATEST_DATASET_FILE.read_text(encoding="utf-8").strip()