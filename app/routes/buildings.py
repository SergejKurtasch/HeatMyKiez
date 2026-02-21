"""Building and buildings search/cascade endpoints."""

from fastapi import APIRouter, Request, HTTPException, Query

router = APIRouter()


@router.get("/building/{address:path}")
def get_building_by_address(request: Request, address: str):
    """GET /api/building/:address — address is slug. 404 if not found."""
    store = request.app.state.building_store
    building = store.get_by_slug(address)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    # Return dict; convert any NaN/float for JSON
    return _sanitize_building(building)


@router.get("/buildings/search")
def search_buildings(
    request: Request,
    query: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
):
    """GET /api/buildings/search?query=...&limit=20"""
    store = request.app.state.building_store
    return store.search(query, limit=limit)


@router.get("/buildings/streets")
def get_streets(request: Request, postal_code: str = Query(..., min_length=1)):
    """GET /api/buildings/streets?postal_code=..."""
    store = request.app.state.building_store
    return store.get_streets_by_postal_code(postal_code)


@router.get("/buildings")
def list_buildings(
    request: Request,
    postal_code: str = Query(None),
    street: str = Query(None),
):
    """GET /api/buildings?postal_code=...&street=... — cascade: list buildings for postal_code + street."""
    store = request.app.state.building_store
    if not postal_code or not street:
        return []
    return store.list_by_postal_code_and_street(postal_code, street)


def _sanitize_building(b: dict) -> dict:
    """Replace NaN and ensure JSON-serializable types."""
    import math
    out = {}
    for k, v in b.items():
        if v is None:
            out[k] = None
        elif isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            out[k] = None
        else:
            out[k] = v
    return out
