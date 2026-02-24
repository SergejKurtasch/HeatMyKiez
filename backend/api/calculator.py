"""
POST /calculator: run payback calculation with building_id, selected option, and overrides.
Returns RetrofitCostTotal, RetrofitCostTotalAfterSubsidy, YearsUntilBreakeventRentIncrease, etc.
"""
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.calculator_service import run_calculator

router = APIRouter()


class CalculatorRequest(BaseModel):
    building_id: str
    sub_type_of_retrofit: str
    overrides: Optional[Dict[str, Any]] = None


@router.post("")
def post_calculator(body: CalculatorRequest) -> dict:
    """
    Run calculator for chosen retrofit option.
    sub_type_of_retrofit: "Window replacement - double glazing" or "Window replacement - triple glazing"
    overrides: optional TotalSqm, NrUnits, RentPerUnit, EnergyCostsPerMonth, facade_sqm, WindowToFloorRatio, etc.
    """
    result = run_calculator(
        body.building_id,
        body.sub_type_of_retrofit,
        body.overrides or {},
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    years = result.get("YearsUntilBreakeventRentIncrease", 0)
    years_int = int(years)
    months = round((years - years_int) * 12)
    result["years_until_break_even"] = years_int
    result["months_until_break_even"] = months
    return result
