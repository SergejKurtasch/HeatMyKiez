"""
UserStore: read/write data/users.csv.
"""

import csv
import logging
import uuid
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

USERS_CSV_COLUMNS = [
    "id",
    "name",
    "email",
    "building_id",
    "subscription_status",
    "warmmiete",
    "kaltmiete",
    "apartment_area_m2",
    "profile_updated_at",
    "created_at",
]


class UserStore:
    """CSV-backed store for users. One file read/write per operation."""

    def __init__(self, data_dir: Optional[Path] = None) -> None:
        self._data_dir = data_dir or Path(__file__).resolve().parents[2] / "data"
        self._path = self._data_dir / "users.csv"
        self._ensure_file()

    def _ensure_file(self) -> None:
        if not self._path.exists():
            self._path.parent.mkdir(parents=True, exist_ok=True)
            with open(self._path, "w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=USERS_CSV_COLUMNS)
                w.writeheader()
            logger.info("Created empty users.csv at %s", self._path)

    def _read_all(self) -> list[dict[str, Any]]:
        if not self._path.exists():
            return []
        with open(self._path, "r", encoding="utf-8", newline="") as f:
            return list(csv.DictReader(f))

    def _write_all(self, rows: list[dict[str, Any]]) -> None:
        with open(self._path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=USERS_CSV_COLUMNS, extrasaction="ignore")
            w.writeheader()
            for r in rows:
                w.writerow({k: r.get(k, "") for k in USERS_CSV_COLUMNS})

    def create(
        self,
        name: str,
        email: str,
        building_id: str,
        subscription_status: str = "",
        warmmiete: Optional[float] = None,
        kaltmiete: Optional[float] = None,
        apartment_area_m2: Optional[float] = None,
    ) -> dict[str, Any]:
        """Append a new user. Returns created user with id and created_at."""
        import datetime
        now = datetime.datetime.utcnow().isoformat() + "Z"
        user_id = uuid.uuid4().hex
        row = {
            "id": user_id,
            "name": (name or "").strip(),
            "email": (email or "").strip(),
            "building_id": (building_id or "").strip(),
            "subscription_status": subscription_status or "",
            "warmmiete": warmmiete if warmmiete is not None else "",
            "kaltmiete": kaltmiete if kaltmiete is not None else "",
            "apartment_area_m2": apartment_area_m2 if apartment_area_m2 is not None else "",
            "profile_updated_at": "",
            "created_at": now,
        }
        rows = self._read_all()
        rows.append(row)
        self._write_all(rows)
        return {**row, "id": user_id, "created_at": now}

    def get_by_id(self, id: str) -> Optional[dict[str, Any]]:
        """Return user by id."""
        for r in self._read_all():
            if r.get("id") == id:
                return r
        return None

    def get_by_building_id(self, building_id: str) -> list[dict[str, Any]]:
        """Return all users for the given building_id."""
        bid = (building_id or "").strip()
        return [r for r in self._read_all() if r.get("building_id") == bid]

    def count_by_building_id(self, building_id: str) -> int:
        """Count users for building_id (for neighbors logic)."""
        return len(self.get_by_building_id(building_id))

    def update(
        self,
        id: str,
        warmmiete: Optional[float] = None,
        kaltmiete: Optional[float] = None,
        apartment_area_m2: Optional[float] = None,
    ) -> Optional[dict[str, Any]]:
        """Update profile fields; set profile_updated_at when any of these change."""
        import datetime
        rows = self._read_all()
        for i, r in enumerate(rows):
            if r.get("id") != id:
                continue
            updated = False
            if warmmiete is not None and r.get("warmmiete") != warmmiete:
                r["warmmiete"] = warmmiete
                updated = True
            if kaltmiete is not None and r.get("kaltmiete") != kaltmiete:
                r["kaltmiete"] = kaltmiete
                updated = True
            if apartment_area_m2 is not None and r.get("apartment_area_m2") != apartment_area_m2:
                r["apartment_area_m2"] = apartment_area_m2
                updated = True
            if updated:
                r["profile_updated_at"] = datetime.datetime.utcnow().isoformat() + "Z"
            rows[i] = r
            self._write_all(rows)
            return r
        return None
