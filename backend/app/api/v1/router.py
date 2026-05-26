"""
AdaptiveAI — v1 Router Aggregator
====================================
Mounts all v1 route modules under /api/v1.
"""

from fastapi import APIRouter
from app.api.v1.routes import auth, organizations, agents, recommendations, alerts, market, intelligence

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router)
router.include_router(organizations.router)
router.include_router(agents.router)
router.include_router(recommendations.router)
router.include_router(alerts.router)
router.include_router(market.router)
router.include_router(intelligence.router)
