"""POST /api/ai-recommendations — AI selects 3 DIY + 3 whole-building measures from applicable list; save to RecommendationStore."""

import json
import logging
import os
from pathlib import Path

from fastapi import APIRouter, Request, HTTPException, Body
from dotenv import load_dotenv

from app.calculator import compute_measures
from app.main import DATA_DIR

load_dotenv()
router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("")
async def post_ai_recommendations(
    request: Request,
    body: dict = Body(default_factory=dict),
):
    """
    POST /api/ai-recommendations.
    Body: { "building_id": "..." } or building object.
    Returns and saves structured recommendation (diy_measures, whole_building_measures).
    """
    building_store = request.app.state.building_store
    measure_store = request.app.state.measure_store
    recommendation_store = request.app.state.recommendation_store

    building_id = body.get("building_id")
    if building_id:
        # Resolve by building_id: get slug from any building (we need one building with that id)
        building = _get_building_by_id(building_store, building_id)
    else:
        building = body
        building_id = building.get("building_id")
    if not building or not building_id:
        raise HTTPException(status_code=400, detail="building_id or building data required")

    measures = measure_store.list_all()
    computed = compute_measures(building, measures, DATA_DIR)
    if not computed:
        raise HTTPException(status_code=404, detail="No applicable measures for this building")

    # Build prompt: list applicable measures with measure_id, measure_name, category, cost, savings %
    measures_desc = [
        {
            "measure_id": m["measure_id"],
            "measure_name": m["measure_name"],
            "category": m["category"],
            "estimated_cost_eur": m["estimated_cost"],
            "expected_savings_pct": m["estimated_savings_pct"],
        }
        for m in computed
    ]
    prompt = _build_prompt(building, measures_desc)
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY not set; returning rule-based selection instead of LLM")
        diy, whole = _fallback_select(computed)
    else:
        try:
            diy, whole = await _call_openai(prompt, api_key, computed)
        except Exception as e:
            logger.exception("OpenAI call failed: %s", e)
            diy, whole = _fallback_select(computed)

    payload = {
        "diy_measures": diy,
        "whole_building_measures": whole,
        "building_id": building_id,
    }
    recommendation_store.save(
        building_id=building_id,
        payload=payload,
        estimated_cost=sum(m.get("estimated_cost_eur", 0) for m in diy + whole),
    )
    return payload


def _get_building_by_id(building_store, building_id: str):
    """Resolve building by building_id."""
    return building_store.get_by_building_id(building_id)


def _build_prompt(building: dict, measures_desc: list[dict]) -> str:
    lines = [
        "You are an energy retrofit advisor. Given building data and a list of applicable measures (with cost and savings %),",
        "select exactly 3 DIY measures (budgets ~100, 200, 300 EUR) and exactly 3 whole-building/capital measures.",
        "Return ONLY valid JSON with two arrays: diy_measures and whole_building_measures.",
        "Each element: { \"measure_id\": \"...\", \"measure_name\": \"...\", \"estimated_cost_eur\": number, \"expected_savings_pct\": number, \"note_landlord_if_applicable\": \"Work should be done for the whole building with landlord involvement.\" }.",
        "Building: " + json.dumps({k: v for k, v in building.items() if k != "address_slug" and v is not None}, default=str)[:800],
        "Applicable measures: " + json.dumps(measures_desc),
    ]
    return "\n".join(lines)


async def _call_openai(prompt: str, api_key: str, computed: list[dict]) -> tuple[list, list]:
    """Call OpenAI and parse diy_measures + whole_building_measures from response."""
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key)
    r = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    text = (r.choices[0].message.content or "").strip()
    # Extract JSON (handle markdown code block)
    if "```" in text:
        start = text.find("```") + 3
        if text[start:start+4] == "json":
            start += 4
        end = text.find("```", start)
        text = text[start:end] if end > start else text[start:]
    data = json.loads(text)
    diy = data.get("diy_measures") or []
    whole = data.get("whole_building_measures") or []
    # Enrich with full fields from computed
    by_id = {m["measure_id"]: m for m in computed}
    diy_out = []
    for x in diy[:3]:
        mid = x.get("measure_id")
        if mid and mid in by_id:
            m = by_id[mid]
            diy_out.append({
                "measure_id": mid,
                "measure_name": m.get("measure_name"),
                "estimated_cost_eur": m.get("estimated_cost"),
                "expected_savings_pct": m.get("estimated_savings_pct"),
                "note_landlord_if_applicable": x.get("note_landlord_if_applicable") or "",
            })
    whole_out = []
    for x in whole[:3]:
        mid = x.get("measure_id")
        if mid and mid in by_id:
            m = by_id[mid]
            whole_out.append({
                "measure_id": mid,
                "measure_name": m.get("measure_name"),
                "estimated_cost_eur": m.get("estimated_cost"),
                "expected_savings_pct": m.get("estimated_savings_pct"),
                "note_landlord_if_applicable": "Work should be done for the whole building with landlord involvement.",
            })
    return diy_out, whole_out


def _fallback_select(computed: list[dict]) -> tuple[list[dict], list[dict]]:
    """Rule-based: 3 DIY (low cost, not whole_building) and 3 whole_building."""
    diy_candidates = [m for m in computed if not m.get("requires_whole_building_landlord") and (m.get("estimated_cost") or 0) < 1000]
    whole_candidates = [m for m in computed if m.get("requires_whole_building_landlord")]
    diy = []
    for target in [100, 200, 300]:
        best = None
        for m in diy_candidates:
            if m in diy:
                continue
            c = m.get("estimated_cost") or 0
            if best is None or abs(c - target) < abs((best.get("estimated_cost") or 0) - target):
                best = m
        if best:
            diy.append({
                "measure_id": best["measure_id"],
                "measure_name": best["measure_name"],
                "estimated_cost_eur": best["estimated_cost"],
                "expected_savings_pct": best["estimated_savings_pct"],
                "note_landlord_if_applicable": "",
            })
    whole = [
        {
            "measure_id": m["measure_id"],
            "measure_name": m["measure_name"],
            "estimated_cost_eur": m["estimated_cost"],
            "expected_savings_pct": m["estimated_savings_pct"],
            "note_landlord_if_applicable": "Work should be done for the whole building with landlord involvement.",
        }
        for m in whole_candidates[:3]
    ]
    return diy, whole
