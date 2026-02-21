"""
RequestStore: read/write data/requests.csv.
One record per user_id; create_or_update overwrites when same user, new building_id.
"""

import csv
import logging
import uuid
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

REQUESTS_CSV_COLUMNS = [
    "id",
    "user_id",
    "building_id",
    "status",
    "created_at",
    "updated_at",
]


class RequestStore:
    """CSV-backed store for requests (one per user)."""

    def __init__(self, data_dir: Optional[Path] = None) -> None:
        self._data_dir = data_dir or Path(__file__).resolve().parents[2] / "data"
        self._path = self._data_dir / "requests.csv"
        self._ensure_file()

    def _ensure_file(self) -> None:
        if not self._path.exists():
            self._path.parent.mkdir(parents=True, exist_ok=True)
            with open(self._path, "w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=REQUESTS_CSV_COLUMNS)
                w.writeheader()
            logger.info("Created empty requests.csv at %s", self._path)

    def _read_all(self) -> list[dict[str, Any]]:
        if not self._path.exists():
            return []
        with open(self._path, "r", encoding="utf-8", newline="") as f:
            return list(csv.DictReader(f))

    def _write_all(self, rows: list[dict[str, Any]]) -> None:
        with open(self._path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=REQUESTS_CSV_COLUMNS, extrasaction="ignore")
            w.writeheader()
            for r in rows:
                w.writerow({k: r.get(k, "") for k in REQUESTS_CSV_COLUMNS})

    def create_or_update(
        self,
        user_id: str,
        building_id: str,
        status: str = "pending",
    ) -> dict[str, Any]:
        """One record per user_id: insert or overwrite existing."""
        import datetime
        now = datetime.datetime.utcnow().isoformat() + "Z"
        uid = (user_id or "").strip()
        bid = (building_id or "").strip()
        rows = self._read_all()
        found = False
        for r in rows:
            if r.get("user_id") == uid:
                r["building_id"] = bid
                r["status"] = status or "pending"
                r["updated_at"] = now
                found = True
                self._write_all(rows)
                return r
        if not found:
            row = {
                "id": uuid.uuid4().hex,
                "user_id": uid,
                "building_id": bid,
                "status": status or "pending",
                "created_at": now,
                "updated_at": now,
            }
            rows.append(row)
            self._write_all(rows)
            return row

    def get_by_user(self, user_id: str) -> Optional[dict[str, Any]]:
        """Return the single request for user_id, or None."""
        uid = (user_id or "").strip()
        for r in self._read_all():
            if r.get("user_id") == uid:
                return r
        return None

    def list_by_building(self, building_id: str) -> list[dict[str, Any]]:
        """Return all requests for the given building_id."""
        bid = (building_id or "").strip()
        return [r for r in self._read_all() if r.get("building_id") == bid]
