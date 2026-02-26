"""
Building search and get by id. Returns building row + optional Calculator-derived prefill (RentPerUnit, facade_sqm_suggestion, etc.).
"""
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query

from backend.services.address_parser import parse_address
from backend.services.calculator_service import get_facade_sqm_suggestion, run_calculator
from backend.services.excel_loader import get_buildings

router = APIRouter()


def _row_to_building(row) -> Dict[str, Any]:
    d = row.to_dict() if hasattr(row, "to_dict") else dict(row)
    out = {}
    for k, v in d.items():
        if v is None:
            continue
        if hasattr(v, "item"):
            v = v.item()
        if isinstance(v, float) and (v != v or v == float("inf")):
            continue
        out[str(k)] = v
    if "address" in out:
        street, number = parse_address(str(out["address"]))
        out["street"] = street
        out["number"] = number
    if "city" not in out and "district" in out:
        out["city"] = "Berlin"
    return out


def _add_prefill(building: Dict[str, Any], building_id: str) -> Dict[str, Any]:
    """Add facade_sqm_suggestion, RentPerUnit, EnergyCostsPerMonth from calculator."""
    suggestion = get_facade_sqm_suggestion(building_id)
    if suggestion is not None:
        building["facade_sqm_suggestion"] = suggestion
    try:
        calc = run_calculator(building_id, "Window replacement - triple glazing", {})
        if "error" not in calc:
            building["RentPerUnit"] = calc.get("RentPerUnit")
            building["EnergyCostsPerMonth"] = calc.get("EnergyCostsPerMonth")
    except Exception:
        pass
    return building


@router.get("/search")
def search_building(
    postcode: str = Query(..., description="Postal code"),
    address: str = Query(..., description="Full address (street + number)"),
) -> dict:
    """Find building by postal_code and address. Returns one building row."""
    df = get_buildings()
    if "postal_code" not in df.columns or "address" not in df.columns:
        raise HTTPException(status_code=500, detail="Buildings data missing columns")
    pc = str(postcode).strip()
    addr = str(address).strip()
    mask = (df["postal_code"].astype(str).str.strip() == pc) & (
        df["address"].astype(str).str.strip() == addr
    )
    match = df[mask]
    if match.empty:
        raise HTTPException(status_code=404, detail="Building not found")
    row = match.iloc[0]
    building = _row_to_building(row)
    building_id = building.get("building_id")
    if building_id:
        building = _add_prefill(building, str(building_id))
    return building


@router.get("/{building_id}")
def get_building(building_id: str) -> dict:
    """Get building by id with optional prefill (RentPerUnit, facade_sqm_suggestion)."""
    df = get_buildings()
    if "building_id" not in df.columns:
        raise HTTPException(status_code=500, detail="Buildings data missing building_id")
    match = df[df["building_id"].astype(str) == str(building_id)]
    if match.empty:
        raise HTTPException(status_code=404, detail="Building not found")
    building = _row_to_building(match.iloc[0])
    building = _add_prefill(building, str(building_id))
    return building
