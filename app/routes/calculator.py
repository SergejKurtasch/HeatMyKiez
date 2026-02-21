"""Calculator: GET /api/building/:address/calculator or GET /api/calculator?address_slug=..."""

from pathlib import Path
from fastapi import APIRouter, Request, HTTPException, Query

from app.calculator import compute_measures
from app.main import DATA_DIR

router = APIRouter()


@router.get("/building/{address:path}/calculator")
def get_calculator_by_address(request: Request, address: str):
    """GET /api/building/:address/calculator — building + applicable measures with costs."""
    return _calculator_response(request, address_slug=address)


@router.get("/calculator")
def get_calculator_by_query(
    request: Request,
    address_slug: str = Query(..., description="Building address slug"),
):
    """GET /api/calculator?address_slug=..."""
    return _calculator_response(request, address_slug=address_slug)


def _sanitize_for_json(obj):
    """Convert numpy/NaN to JSON-serializable types."""
    import math
    if obj is None:
        return None
    if isinstance(obj, (str, int)):
        return obj
    if isinstance(obj, bool):
        return obj
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if hasattr(obj, "item"):  # numpy scalar
        try:
            return obj.item()
        except Exception:
            return None
    if isinstance(obj, dict):
        return {k: _sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize_for_json(x) for x in obj]
    return obj


def _calculator_response(request: Request, address_slug: str):
    building_store = request.app.state.building_store
    measure_store = request.app.state.measure_store
    building = building_store.get_by_slug(address_slug)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    measures = measure_store.list_all()
    computed = compute_measures(building, measures, DATA_DIR)
    return {
        "building": _sanitize_for_json(building),
        "measures": _sanitize_for_json(computed),
    }
