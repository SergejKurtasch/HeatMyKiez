"""
HeatMyKiez API: building retrofit payback calculator.
All code and API in English.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api import addresses, buildings, calculator, contractors
from backend.services.excel_loader import load_excel_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load Excel data at startup."""
    load_excel_data()
    yield
    # cleanup if needed


app = FastAPI(
    title="HeatMyKiez API",
    description="Building retrofit payback calculator",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(addresses.router, prefix="/addresses", tags=["addresses"])
app.include_router(buildings.router, prefix="/buildings", tags=["buildings"])
app.include_router(calculator.router, prefix="/calculator", tags=["calculator"])
app.include_router(contractors.router, prefix="/contractors", tags=["contractors"])


@app.get("/health")
def health():
    return {"status": "ok"}
