"""
Eco Backend API — FastAPI app.
Stores are initialized at startup (buildings/measures in memory; users/requests/recommendations in CSV).
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.stores import (
    BuildingStore,
    MeasureStore,
    UserStore,
    RequestStore,
    RecommendationStore,
)

# Data directory relative to project root
DATA_DIR = Path(__file__).resolve().parents[1] / "data"

# Global store instances (loaded at startup)
building_store: BuildingStore = None  # type: ignore
measure_store: MeasureStore = None   # type: ignore
user_store: UserStore = None          # type: ignore
request_store: RequestStore = None   # type: ignore
recommendation_store: RecommendationStore = None  # type: ignore


def get_stores():
    """Return (building_store, measure_store, user_store, request_store, recommendation_store)."""
    return building_store, measure_store, user_store, request_store, recommendation_store


def create_app() -> FastAPI:
    global building_store, measure_store, user_store, request_store, recommendation_store
    building_store = BuildingStore(DATA_DIR)
    measure_store = MeasureStore(DATA_DIR)
    user_store = UserStore(DATA_DIR)
    request_store = RequestStore(DATA_DIR)
    recommendation_store = RecommendationStore(DATA_DIR)

    app = FastAPI(
        title="Eco Backend API",
        description="Backend for ViabCheck / Eco: buildings, calculator, users, requests, AI recommendations.",
        version="0.1.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app


app = create_app()

# Attach stores to app.state for use in routes
app.state.building_store = building_store
app.state.measure_store = measure_store
app.state.user_store = user_store
app.state.request_store = request_store
app.state.recommendation_store = recommendation_store

# Register API routes
from app.routes import router as api_router
app.include_router(api_router, prefix="/api")


@app.get("/", include_in_schema=False)
def root():
    """Redirect to API docs."""
    return RedirectResponse(url="/docs")
