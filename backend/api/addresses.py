"""
Address cascading: streets by postcode, numbers by postcode+street.
"""
from fastapi import APIRouter, Query

from backend.services.address_parser import (
    get_unique_numbers_for_street,
    get_unique_streets_for_postcode,
)
from backend.services.excel_loader import get_buildings

router = APIRouter()


@router.get("/streets")
def get_streets(postcode: str = Query(..., description="Postal code")) -> dict:
    """Return list of street names that exist in DB for this postcode."""
    df = get_buildings()
    streets = get_unique_streets_for_postcode(df, postcode)
    return {"postcode": postcode, "streets": streets}


@router.get("/numbers")
def get_numbers(
    postcode: str = Query(..., description="Postal code"),
    street: str = Query(..., description="Street name"),
) -> dict:
    """Return list of house numbers that exist in DB for this postcode and street."""
    df = get_buildings()
    numbers = get_unique_numbers_for_street(df, postcode, street)
    return {"postcode": postcode, "street": street, "numbers": numbers}
