"""
Replicate Excel Calculator sheet logic for window retrofit payback.
Uses buildings, financials, energy_consumption, retrofits, parameters.
Returns same field names as plan: RetrofitCostTotal, RetrofitCostTotalAfterSubsidy,
YearsUntilBreakeventRentIncrease, etc.
"""
from typing import Any, Dict, Optional

import pandas as pd

from backend.services.excel_loader import (
    get_buildings,
    get_energy_consumption,
    get_financials,
    get_parameters,
    get_retrofits,
)

# Floor height for facade suggestion: interior + 0.4 m slab (plan §3.2)
INTERIOR_HEIGHT_BY_BUILDING_TYPE = {
    "Altbau": 3.2,
    "Gründerzeit": 3.3,
    "Modern": 2.8,
    "1970s block": 2.6,
    "1980s block": 2.7,
    "Post-war": 2.8,
    "Plattenbau": 2.6,
}
INTER_FLOOR_SLAB_M = 0.4


def _get_building_row(building_id: str) -> Optional[Dict[str, Any]]:
    df = get_buildings()
    if "building_id" not in df.columns:
        return None
    row = df[df["building_id"].astype(str) == str(building_id)]
    if row.empty:
        return None
    return row.iloc[0].to_dict()


def _get_rent_per_sqm(building_id: str) -> float:
    """Rent per sqm from financials. RentPerUnit = avg_rent_eur_m2 * TotalSqm / NrUnits."""
    try:
        fin = get_financials()
        if fin is None or fin.empty:
            return 0.0
        if "building_id" in fin.columns and "avg_rent_eur_m2" in fin.columns:
            r = fin[fin["building_id"].astype(str) == str(building_id)]
            if not r.empty and pd.notna(r.iloc[0].get("avg_rent_eur_m2")):
                return float(r.iloc[0]["avg_rent_eur_m2"])
    except Exception:
        pass
    return 0.0


def _get_energy_cost_per_month(building_id: str) -> float:
    """Average monthly energy cost from energy_consumption (Calculator B10). Uses total_cost_eur."""
    try:
        ec = get_energy_consumption()
        if ec is None or ec.empty or "building_id" not in ec.columns:
            return 0.0
        subset = ec[ec["building_id"].astype(str) == str(building_id)]
        if subset.empty:
            return 0.0
        if "total_cost_eur" in subset.columns:
            return float(subset["total_cost_eur"].mean())
        numeric_cols = subset.select_dtypes(include=["number"]).columns
        if len(numeric_cols) == 0:
            return 0.0
        return float(subset[numeric_cols].mean().mean())
    except Exception:
        return 0.0


def _get_parameters() -> Dict[str, float]:
    p = {}
    try:
        df = get_parameters()
        if df is not None and not df.empty and "Variables" in df.columns and "Value" in df.columns:
            for _, row in df.iterrows():
                name = row.get("Variables")
                val = row.get("Value")
                if pd.notna(name) and pd.notna(val):
                    try:
                        p[str(name).strip()] = float(val)
                    except (ValueError, TypeError):
                        pass
    except Exception:
        pass
    if "WindowToFloorRatio" not in p:
        p["WindowToFloorRatio"] = 0.14
    if "WindowSubsidyParameter" not in p:
        p["WindowSubsidyParameter"] = 0.65
    if "RentIncreasePct" not in p:
        p["RentIncreasePct"] = 0.04
    return p


def _get_retrofit_costs_and_savings() -> Dict[str, Dict[str, float]]:
    """From retrofits sheet: double glazing and triple glazing cost per m2 and savings %."""
    result = {"double": {"cost_per_m2": 450.0, "savings_pct": 12.0}, "triple": {"cost_per_m2": 550.0, "savings_pct": 15.0}}
    try:
        df = get_retrofits()
        if df is None or df.empty:
            return result
        for _, row in df.iterrows():
            name = str(row.get("measure_name", "")).lower()
            if "double" in name and "glaz" in name:
                try:
                    result["double"]["cost_per_m2"] = float(row.get("typical_cost_eur_m2", 0) or 450)
                    result["double"]["savings_pct"] = float(row.get("expected_savings_pct", 0) or 12)
                except (ValueError, TypeError):
                    pass
            if "triple" in name and "glaz" in name:
                try:
                    result["triple"]["cost_per_m2"] = float(row.get("typical_cost_eur_m2", 0) or 550)
                    result["triple"]["savings_pct"] = float(row.get("expected_savings_pct", 0) or 15)
                except (ValueError, TypeError):
                    pass
    except Exception:
        pass
    return result


def _normalize_window_type(wt: Any) -> str:
    if pd.isna(wt):
        return "Single-pane"
    s = str(wt).strip()
    if not s:
        return "Single-pane"
    if "single" in s.lower() or "Single" in s:
        return "Single-pane"
    if "double" in s.lower() or "Double" in s:
        return "Double-pane"
    if "triple" in s.lower() or "Triple" in s:
        return "Triple-pane"
    return s


def run_calculator(
    building_id: str,
    sub_type_of_retrofit: str,
    overrides: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Run calculator for given building and retrofit subtype.
    sub_type_of_retrofit: "Window replacement - double glazing" or "Window replacement - triple glazing"
    overrides: optional dict with TotalSqm, NrUnits, WindowType, EnergyCostsPerMonth, RentPerUnit, facade_sqm, etc.
    """
    overrides = overrides or {}
    building = _get_building_row(building_id)
    if not building:
        return {"error": "Building not found"}

    def _ov(key: str, default: Any = None):
        return overrides.get(key, building.get(key, default))

    TotalSqm = float(_ov("total_area_m2", _ov("TotalSqm", 0)) or 0)
    NrUnits = int(_ov("num_units", _ov("NrUnits", 0)) or 0)
    WindowType = _normalize_window_type(_ov("window_type", _ov("WindowType")))
    EnergyCostsPerMonth = float(_ov("EnergyCostsPerMonth", 0)) or _get_energy_cost_per_month(building_id)
    RentPerUnit = float(_ov("RentPerUnit", 0)) or 0.0
    if RentPerUnit <= 0:
        rent_per_sqm = _get_rent_per_sqm(building_id)
        if NrUnits > 0 and TotalSqm > 0:
            RentPerUnit = rent_per_sqm * TotalSqm / NrUnits
        if RentPerUnit <= 0:
            RentPerUnit = 800.0

    params = _get_parameters()
    WindowToFloorRatio = float(overrides.get("WindowToFloorRatio", params.get("WindowToFloorRatio", 0.14)))
    WindowSubsidyParameter = float(params.get("WindowSubsidyParameter", 0.65))
    RentIncreasePct = float(params.get("RentIncreasePct", 0.04))

    retro = _get_retrofit_costs_and_savings()
    is_double = "double" in sub_type_of_retrofit.lower()
    cost_per_m2 = retro["double"]["cost_per_m2"] if is_double else retro["triple"]["cost_per_m2"]
    savings_pct = retro["double"]["savings_pct"] if is_double else retro["triple"]["savings_pct"]

    RetrofitCostTotal = cost_per_m2 * TotalSqm * WindowToFloorRatio
    RetrofitCostTotalAfterSubsidy = RetrofitCostTotal * WindowSubsidyParameter
    EnergySavingsPerMonth = EnergyCostsPerMonth * (savings_pct / 100.0)
    YearUntilBreakeven = (
        RetrofitCostTotalAfterSubsidy / (EnergySavingsPerMonth * 12)
        if EnergySavingsPerMonth > 0
        else 0
    )
    SavingsPerUnit = EnergySavingsPerMonth / NrUnits if NrUnits > 0 else 0
    RentIncreasePerUnit = RentIncreasePct * RentPerUnit
    TenantSavingsPerUnit = SavingsPerUnit - RentIncreasePerUnit
    YearlyExtraIncome = RentIncreasePerUnit * NrUnits * 12
    YearsUntilBreakeventRentIncrease = (
        RetrofitCostTotalAfterSubsidy / YearlyExtraIncome if YearlyExtraIncome > 0 else 0
    )

    return {
        "TotalSqm": round(TotalSqm, 2),
        "NrUnits": NrUnits,
        "WindowType": WindowType,
        "EnergyCostsPerMonth": round(EnergyCostsPerMonth, 2),
        "RentPerUnit": round(RentPerUnit, 2),
        "SubTypeOfRetrofit": sub_type_of_retrofit,
        "RetrofitCostTotal": round(RetrofitCostTotal, 2),
        "RetrofitCostTotalAfterSubsidy": round(RetrofitCostTotalAfterSubsidy, 2),
        "EnergySavingsPerMonth": round(EnergySavingsPerMonth, 2),
        "YearUntilBreakeven": round(YearUntilBreakeven, 2),
        "SavingsPerUnit": round(SavingsPerUnit, 2),
        "RentIncreasePerUnit": round(RentIncreasePerUnit, 2),
        "TenantSavingsPerUnit": round(TenantSavingsPerUnit, 2),
        "YearlyExtraIncome": round(YearlyExtraIncome, 2),
        "YearsUntilBreakeventRentIncrease": round(YearsUntilBreakeventRentIncrease, 2),
        "EnergySavingsPct": round(savings_pct, 2),
    }


def get_facade_sqm_suggestion(building_id: str) -> Optional[float]:
    """Suggested facade sqm: 4 * sqrt(total_area_m2/num_floors) * floor_height_m * num_floors."""
    building = _get_building_row(building_id)
    if not building:
        return None
    total_area_m2 = float(building.get("total_area_m2", 0) or 0)
    num_floors = int(building.get("num_floors", 0) or 1)
    if num_floors < 1:
        num_floors = 1
    bt = building.get("building_type", "Modern")
    interior = INTERIOR_HEIGHT_BY_BUILDING_TYPE.get(str(bt), 2.8)
    floor_height_m = interior + INTER_FLOOR_SLAB_M
    import math
    side = math.sqrt(total_area_m2 / num_floors) if total_area_m2 > 0 and num_floors > 0 else 0
    if side <= 0:
        return None
    return round(4 * side * floor_height_m * num_floors, 2)
