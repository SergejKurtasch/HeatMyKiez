from fastapi import APIRouter
from app.routes import buildings, users, requests as requests_routes, calculator, ai_recommendations

router = APIRouter()

# Register calculator before buildings so /api/building/:address/calculator is matched first
router.include_router(calculator.router, tags=["calculator"])
router.include_router(buildings.router, tags=["buildings"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(requests_routes.router, prefix="/requests", tags=["requests"])
router.include_router(ai_recommendations.router, prefix="/ai-recommendations", tags=["ai"])
