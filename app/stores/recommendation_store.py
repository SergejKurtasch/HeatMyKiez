"""
RecommendationStore: append-only data/recommendations.csv.
get_by_building returns the latest row for building_id.
"""

import csv
import json
import logging
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

RECOMMENDATIONS_CSV_COLUMNS = [
    "building_id",
    "payload",
    "estimated_cost",
    "monthly_savings",
    "created_at",
]


class RecommendationStore:
    """CSV-backed store for AI recommendations. Append new rows; get_by_building returns latest."""

    def __init__(self, data_dir: Optional[Path] = None) -> None:
        self._data_dir = data_dir or Path(__file__).resolve().parents[2] / "data"
        self._path = self._data_dir / "recommendations.csv"
        self._ensure_file()

    def _ensure_file(self) -> None:
        if not self._path.exists():
            self._path.parent.mkdir(parents=True, exist_ok=True)
            with open(self._path, "w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=RECOMMENDATIONS_CSV_COLUMNS)
                w.writeheader()
            logger.info("Created empty recommendations.csv at %s", self._path)

    def _read_all(self) -> list[dict[str, Any]]:
        if not self._path.exists():
            return []
        with open(self._path, "r", encoding="utf-8", newline="") as f:
            return list(csv.DictReader(f))

    def _write_all(self, rows: list[dict[str, Any]]) -> None:
        with open(self._path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=RECOMMENDATIONS_CSV_COLUMNS, extrasaction="ignore")
            w.writeheader()
            for r in rows:
                w.writerow({k: r.get(k, "") for k in RECOMMENDATIONS_CSV_COLUMNS})

    def save(
        self,
        building_id: str,
        payload: dict[str, Any],
        estimated_cost: Optional[float] = None,
        monthly_savings: Optional[float] = None,
    ) -> dict[str, Any]:
        """Append a new recommendation row (history). payload stored as JSON string."""
        import datetime
        now = datetime.datetime.utcnow().isoformat() + "Z"
        row = {
            "building_id": (building_id or "").strip(),
            "payload": json.dumps(payload) if isinstance(payload, dict) else str(payload),
            "estimated_cost": estimated_cost if estimated_cost is not None else "",
            "monthly_savings": monthly_savings if monthly_savings is not None else "",
            "created_at": now,
        }
        rows = self._read_all()
        rows.append(row)
        self._write_all(rows)
        return row

    def get_by_building(self, building_id: str) -> Optional[dict[str, Any]]:
        """Return the latest recommendation for building_id (last row)."""
        bid = (building_id or "").strip()
        all_rows = [r for r in self._read_all() if r.get("building_id") == bid]
        if not all_rows:
            return None
        r = all_rows[-1]
        if r.get("payload"):
            try:
                r = {**r, "payload": json.loads(r["payload"])}
            except (json.JSONDecodeError, TypeError):
                pass
        return r
