"""
Calculator: filter applicable measures and compute cost/savings/payback.
Formulas follow data/mock_data_combo.xlsx, sheet Calculator:
- Cost: retrofits!E * B2 * E6  => typical_cost_eur_m2 * total_area_m2 * cost_factor (E6=0.14)
- Subsidy: C14*0.6  => cost * SUBSIDY_RATE
- Savings: B10*retrofits!H  => yearly_eur * (expected_savings_pct/100)
- Payback: we use cost/savings_eur (full cost); sheet F14 uses D14/E14 (subsidy/savings).
Cost rule: typical_cost_eur_m2 < 900 -> multiply by total_area_m2 * factor; else fixed.
"""

import math
from pathlib import Path
from typing import Any, Optional

import pandas as pd

# Threshold (EUR): below = per m2, >= = one-time cost
COST_THRESHOLD_EUR = 900
# From xlsx: cost factor
DEFAULT_COST_FACTOR = 0.14
# Subsidy share
SUBSIDY_RATE = 0.6
# Categories that require whole building / landlord
WHOLE_BUILDING_CATEGORIES = {"Envelope", "Heating"}


def _get_yearly_heat_kwh(building: dict[str, Any], data_dir: Path) -> Optional[float]:
    """Yearly heating consumption: sum of heating_kwh for 12 months from energy_consumption.csv, or None."""
    path = data_dir / "energy_consumption.csv"
    if not path.exists():
        return None
    try:
        df = pd.read_csv(path)
        bid = building.get("building_id")
        if not bid:
            return None
        subset = df[df["building_id"] == bid]
        if subset.empty:
            return None
        # Sum heating_kwh per year (take latest year if multiple)
        subset = subset.groupby("year", as_index=False)["heating_kwh"].sum()
        if subset.empty:
            return None
        return float(subset.sort_values("year", ascending=False).iloc[0]["heating_kwh"])
    except Exception:
        return None


def _yearly_heat_fallback(building: dict[str, Any]) -> float:
    """Fallback: energy_consumption_kwh_m2 * total_area_m2."""
    try:
        e = building.get("energy_consumption_kwh_m2")
        a = building.get("total_area_m2")
        if e is None or a is None or (isinstance(e, float) and math.isnan(e)) or (isinstance(a, float) and math.isnan(a)):
            return 0.0
        return float(e) * float(a)
    except (TypeError, ValueError):
        return 0.0


def _safe_str(v: Any) -> str:
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return ""
    return str(v).strip()


def _is_applicable(measure: dict[str, Any], building: dict[str, Any]) -> bool:
    """Filter: prerequisites and already-done state. Simple implementation."""
    cat = _safe_str(measure.get("category"))
    name = _safe_str(measure.get("measure_name")).lower()

    if "roof" in name:
        ir = _safe_str(building.get("insulation_roof"))
        if ir == "Full":
            return False
    if "window" in name:
        wt = _safe_str(building.get("window_type")).lower()
        if "triple" in wt:
            return False
    if "facade" in name:
        iw = _safe_str(building.get("insulation_walls"))
        if iw == "Full":
            return False
    if "basement" in name:
        ib = _safe_str(building.get("insulation_basement"))
        if ib == "Full":
            return False

    prereq = _safe_str(measure.get("prerequisites"))
    if not prereq:
        return True
    # Optional: check "Insulation recommended" etc. For MVP we still include and let AI/UI note it.
    return True


def _estimated_cost(measure: dict[str, Any], building: dict[str, Any], factor: float) -> float:
    """Apply cost rule: < 900 EUR -> per m2 * area * factor; >= 900 -> fixed."""
    try:
        tc = float(measure.get("typical_cost_eur_m2") or 0)
    except (TypeError, ValueError):
        return 0.0
    if math.isnan(tc):
        tc = 0.0
    try:
        area = float(building.get("total_area_m2") or 0)
    except (TypeError, ValueError):
        area = 0.0
    if math.isnan(area):
        area = 0.0

    if tc < COST_THRESHOLD_EUR and area > 0:
        return tc * area * factor
    return tc


def compute_measures(
    building: dict[str, Any],
    measures: list[dict[str, Any]],
    data_dir: Path,
    cost_factor: float = DEFAULT_COST_FACTOR,
    heat_price_per_kwh: float = 0.12,
) -> list[dict[str, Any]]:
    """
    Return list of applicable measures with estimated_cost, subsidy_eur, estimated_savings_eur_per_year, payback_years, requires_whole_building_landlord.
    """
    yearly_kwh = _get_yearly_heat_kwh(building, data_dir)
    if yearly_kwh is None:
        yearly_kwh = _yearly_heat_fallback(building)
    yearly_eur = yearly_kwh * heat_price_per_kwh if yearly_kwh else 0.0

    result = []
    for m in measures:
        if not _is_applicable(m, building):
            continue
        cost = _estimated_cost(m, building, cost_factor)
        subsidy_eur = cost * SUBSIDY_RATE
        try:
            pct = float(m.get("expected_savings_pct") or 0) / 100.0
        except (TypeError, ValueError):
            pct = 0.0
        savings_eur = yearly_eur * pct if yearly_eur else 0.0
        payback = (cost / savings_eur) if savings_eur > 0 else None
        cost_after_subsidy = cost * (1 - SUBSIDY_RATE)
        payback_after_subsidy = (cost_after_subsidy / savings_eur) if savings_eur > 0 else None
        cat = (m.get("category") or "").strip()
        requires_whole = cat in WHOLE_BUILDING_CATEGORIES

        result.append({
            "measure_id": m.get("measure_id"),
            "measure_name": m.get("measure_name"),
            "category": cat,
            "estimated_cost": round(cost, 2),
            "cost_after_subsidy_eur": round(cost_after_subsidy, 2),
            "subsidy_eur": round(subsidy_eur, 2),
            "subsidy_pct": SUBSIDY_RATE,
            "estimated_savings_pct": float(m.get("expected_savings_pct") or 0),
            "estimated_savings_eur_per_year": round(savings_eur, 2),
            "payback_years": round(payback, 1) if payback is not None else None,
            "payback_years_after_subsidy": round(payback_after_subsidy, 1) if payback_after_subsidy is not None else None,
            "subsidy_info": "KfW/Bafa" if (m.get("kfw_eligible") or m.get("bafa_eligible")) else "",
            "requires_whole_building_landlord": requires_whole,
        })
    return result
