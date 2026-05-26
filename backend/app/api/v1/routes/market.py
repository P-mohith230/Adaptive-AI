"""
AdaptiveAI — Market Intelligence Routes
==========================================
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
from app.services.market_intelligence_service import MarketIntelligenceService
from app.services.ai_tool_service import AIToolService
from app.intelligence.engines import MarketEngine, TrustIndex
from app.schemas.ai_tool import AIToolSearchParams

router = APIRouter(prefix="/market", tags=["Market Intelligence"])


@router.get("/trends")
async def get_market_trends():
    """Get aggregated market trend data."""
    service = MarketIntelligenceService()
    return await service.get_trend_summary()


@router.get("/heatmap")
async def get_market_heatmap():
    """Get AI market heatmap data by category."""
    engine = MarketEngine()
    return await engine.get_heatmap_data()


@router.get("/tools")
async def list_ai_tools(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_trust: Optional[float] = None,
    limit: int = 50,
):
    """Search and filter AI tools."""
    service = AIToolService()
    params = AIToolSearchParams(
        category=category,
        search_query=search,
        min_trust_score=min_trust,
        limit=limit,
    )
    return await service.search(params)


@router.get("/tools/{tool_id}")
async def get_tool(tool_id: str):
    """Get detailed info about an AI tool."""
    try:
        service = AIToolService()
        return await service.get_by_id(tool_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/tools/{tool_id}/trust")
async def get_tool_trust_index(tool_id: str):
    """Get trust index breakdown for a tool."""
    index = TrustIndex()
    return await index.calculate(tool_id)


@router.get("/categories")
async def get_categories():
    """Get all AI tool categories with counts."""
    service = AIToolService()
    return await service.get_categories()


@router.get("/intelligence/{tool_name}")
async def get_tool_intelligence(tool_name: str):
    """Get market intelligence for a specific tool."""
    service = MarketIntelligenceService()
    return await service.get_tool_intelligence(tool_name)


@router.post("/crawl/{org_id}")
async def crawl_market_signals(org_id: str):
    """
    Crawls live tech sentiment streams (GitHub, News, PH)
    and saves fresh intelligence signals into database sheet.
    """
    from app.storage.sheet_manager import get_sheet_manager
    sheets = get_sheet_manager()
    org = await sheets.organizations.find_by_id(org_id)
    startup_type = org.get("startup_type", "") if org else ""
    
    service = MarketIntelligenceService()
    signals = await service.crawl_live_market_signals(startup_type)
    return {"status": "success", "crawled_signals_count": len(signals), "signals": signals}
