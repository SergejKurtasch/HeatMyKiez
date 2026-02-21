"""Requests (one per user). POST create_or_update; GET by user_id or building_id."""

from fastapi import APIRouter, Request, Query, Body

router = APIRouter()


@router.post("")
def create_or_update_request(
    request: Request,
    user_id: str | None = Query(None),
    building_id: str | None = Query(None),
    status: str = Query("pending", description="Status"),
    body: dict | None = Body(None),
):
    """POST /api/requests — create or overwrite request for user_id (one per user). Body or query: user_id, building_id."""
    b = body or {}
    uid = user_id or b.get("user_id") or ""
    bid = building_id or b.get("building_id") or ""
    st = b.get("status", status)
    if not uid or not bid:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="user_id and building_id required")
    store = request.app.state.request_store
    return store.create_or_update(user_id=uid, building_id=bid, status=st)


@router.get("")
def list_requests(
    request: Request,
    user_id: str | None = Query(None),
    building_id: str | None = Query(None),
):
    """GET /api/requests?user_id=... or ?building_id=..."""
    store = request.app.state.request_store
    if user_id:
        r = store.get_by_user(user_id)
        return [r] if r else []
    if building_id:
        return store.list_by_building(building_id)
    return []
