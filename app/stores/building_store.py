"""
BuildingStore: in-memory data from data/buildings.csv.
address_slug = normalized postal_code + street + house_num.
"""

import logging
from pathlib import Path
from typing import Any, Optional

import pandas as pd

from app.slug import build_address_slug

logger = logging.getLogger(__name__)


class BuildingStore:
    """In-memory store for buildings. Loads CSV at init and computes address_slug."""

    def __init__(self, data_dir: Optional[Path] = None) -> None:
        self._data_dir = data_dir or Path(__file__).resolve().parents[2] / "data"
        self._df: Optional[pd.DataFrame] = None
        self._load()

    def _load(self) -> None:
        path = self._data_dir / "buildings.csv"
        if not path.exists():
            self._df = pd.DataFrame()
            logger.warning("buildings.csv not found at %s", path)
            return
        try:
            df = pd.read_csv(path)
            # Ensure house_num is string for slug
            df["house_num"] = df["house_num"].astype(str)
            df["address_slug"] = df.apply(
                lambda row: build_address_slug(
                    row.get("postal_code"),
                    row.get("street"),
                    row.get("house_num"),
                ),
                axis=1,
            )
            self._df = df
            logger.info("Loaded %d buildings from %s", len(df), path)
        except Exception as e:
            logger.exception("Failed to load buildings.csv: %s", e)
            self._df = pd.DataFrame()

    def _ensure_loaded(self) -> pd.DataFrame:
        if self._df is None:
            self._load()
        return self._df

    def get_by_slug(self, slug: str) -> Optional[dict[str, Any]]:
        """Return building row as dict by address_slug, or None."""
        df = self._ensure_loaded()
        if df.empty:
            return None
        slug_lower = (slug or "").strip().lower()
        row = df[df["address_slug"].str.lower() == slug_lower]
        if row.empty:
            return None
        return row.iloc[0].to_dict()

    def get_by_building_id(self, building_id: str) -> Optional[dict[str, Any]]:
        """Return building row as dict by building_id, or None."""
        df = self._ensure_loaded()
        if df.empty:
            return None
        bid = (building_id or "").strip()
        row = df[df["building_id"].astype(str) == bid]
        if row.empty:
            return None
        return row.iloc[0].to_dict()

    def search(self, query: str, limit: int = 20) -> list[dict[str, Any]]:
        """Search by address/street/postal_code. Returns list of {id, building_id, address_slug, display_address, latitude, longitude}."""
        df = self._ensure_loaded()
        if df.empty or not (query or "").strip():
            return []
        q = (query or "").strip().lower()
        mask = (
            df["address"].astype(str).str.lower().str.contains(q, na=False)
            | df["street"].astype(str).str.lower().str.contains(q, na=False)
            | df["postal_code"].astype(str).str.contains(q, na=False)
            | df["address_slug"].str.lower().str.contains(q, na=False)
        )
        rows = df[mask].head(limit)
        return self._to_search_results(rows)

    def get_streets_by_postal_code(self, postal_code: str) -> list[str]:
        """Return unique street names for the given postal_code."""
        df = self._ensure_loaded()
        if df.empty or not (postal_code or "").strip():
            return []
        pc = str(postal_code).strip()
        subset = df[df["postal_code"].astype(str) == pc]
        streets = subset["street"].dropna().astype(str).unique().tolist()
        return sorted(s for s in streets if s and s != "nan")

    def list_by_postal_code_and_street(
        self, postal_code: str, street: str
    ) -> list[dict[str, Any]]:
        """Return buildings for postal_code + street (list of {id, building_id, address_slug, display_address, latitude, longitude})."""
        df = self._ensure_loaded()
        if df.empty:
            return []
        pc = str(postal_code or "").strip()
        st = (street or "").strip()
        mask = (df["postal_code"].astype(str) == pc) & (
            df["street"].astype(str).str.lower() == st.lower()
        )
        rows = df[mask]
        return self._to_search_results(rows)

    def _to_search_results(self, rows: pd.DataFrame) -> list[dict[str, Any]]:
        """Build response list with id = building_id, display_address from address."""
        if rows.empty:
            return []
        out = []
        for _, row in rows.iterrows():
            building_id = row.get("building_id")
            display_address = row.get("address") or f"{row.get('street', '')} {row.get('house_num', '')}".strip()
            out.append({
                "id": building_id,
                "building_id": building_id,
                "address_slug": row.get("address_slug"),
                "display_address": display_address,
                "latitude": float(row["latitude"]) if pd.notna(row.get("latitude")) else None,
                "longitude": float(row["longitude"]) if pd.notna(row.get("longitude")) else None,
            })
        return out
