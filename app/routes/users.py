"""User registration and profile update. Neighbors log on create when count > 1."""

import logging
from fastapi import APIRouter, Request, HTTPException, Body

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("")
def create_user(
    request: Request,
    name: str = Body(..., embed=True),
    email: str = Body(..., embed=True),
    building_id: str = Body(..., embed=True),
    warmmiete: float | None = Body(None, embed=True),
    kaltmiete: float | None = Body(None, embed=True),
    apartment_area_m2: float | None = Body(None, embed=True),
):
    """POST /api/users — register. Log 'letter to neighbors' when building has > 1 user."""
    store = request.app.state.user_store
    user = store.create(
        name=name,
        email=email,
        building_id=building_id,
        warmmiete=warmmiete,
        kaltmiete=kaltmiete,
        apartment_area_m2=apartment_area_m2,
    )
    count = store.count_by_building_id(building_id)
    if count > 1:
        logger.info("Neighbors letter: building_id=%s has %d users", building_id, count)
    return user


@router.patch("/{user_id}")
def update_user(
    request: Request,
    user_id: str,
    warmmiete: float | None = Body(None, embed=True),
    kaltmiete: float | None = Body(None, embed=True),
    apartment_area_m2: float | None = Body(None, embed=True),
):
    """PATCH /api/users/:id — update profile; profile_updated_at set when fields change."""
    store = request.app.state.user_store
    user = store.update(
        id=user_id,
        warmmiete=warmmiete,
        kaltmiete=kaltmiete,
        apartment_area_m2=apartment_area_m2,
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}")
def get_user(request: Request, user_id: str):
    """GET /api/users/:id"""
    store = request.app.state.user_store
    user = store.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
