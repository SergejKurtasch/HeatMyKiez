"""
GET /contractors?specialization=window: filter by specialization containing "window" (case-insensitive).
"""
from typing import Any, Dict, List

from fastapi import APIRouter, Query

from backend.services.excel_loader import get_contractors

router = APIRouter()


@router.get("")
def list_contractors(
    specialization: str = Query("window", description="Filter by specialization (e.g. window)"),
) -> dict:
    """Return contractors whose specialization contains the given word (case-insensitive)."""
    df = get_contractors()
    if df is None or df.empty:
        return {"contractors": []}
    word = str(specialization).strip().lower()
    if not word:
        return {"contractors": []}
    if "specialization" not in df.columns:
        return {"contractors": []}
    mask = df["specialization"].astype(str).str.lower().str.contains(word, na=False)
    subset = df[mask]
    contractors: List[Dict[str, Any]] = []
    for _, row in subset.iterrows():
        d = row.to_dict()
        out = {}
        for k, v in d.items():
            if v is not None and (not hasattr(v, "__float__") or str(v) != "nan"):
                out[str(k)] = v
        contractors.append(out)
    return {"contractors": contractors}
