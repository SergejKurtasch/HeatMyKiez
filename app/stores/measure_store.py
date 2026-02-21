"""
MeasureStore: in-memory data from data/retrofit_measures.csv.
"""

import logging
from pathlib import Path
from typing import Any, Optional

import pandas as pd

logger = logging.getLogger(__name__)


class MeasureStore:
    """In-memory store for retrofit measures."""

    def __init__(self, data_dir: Optional[Path] = None) -> None:
        self._data_dir = data_dir or Path(__file__).resolve().parents[2] / "data"
        self._df: Optional[pd.DataFrame] = None
        self._load()

    def _load(self) -> None:
        path = self._data_dir / "retrofit_measures.csv"
        if not path.exists():
            self._df = pd.DataFrame()
            logger.warning("retrofit_measures.csv not found at %s", path)
            return
        try:
            self._df = pd.read_csv(path)
            logger.info("Loaded %d measures from %s", len(self._df), path)
        except Exception as e:
            logger.exception("Failed to load retrofit_measures.csv: %s", e)
            self._df = pd.DataFrame()

    def _ensure_loaded(self) -> pd.DataFrame:
        if self._df is None:
            self._load()
        return self._df

    def list_all(self) -> list[dict[str, Any]]:
        """Return all measures as list of dicts."""
        df = self._ensure_loaded()
        if df.empty:
            return []
        return df.to_dict("records")

    def get_by_id(self, measure_id: str) -> Optional[dict[str, Any]]:
        """Return one measure by measure_id."""
        df = self._ensure_loaded()
        if df.empty:
            return None
        row = df[df["measure_id"] == (measure_id or "").strip()]
        if row.empty:
            return None
        return row.iloc[0].to_dict()
