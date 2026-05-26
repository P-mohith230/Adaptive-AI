"""
AdaptiveAI — Recommendation Routes
=====================================
"""

from fastapi import APIRouter, HTTPException
from app.services.recommendation_service import RecommendationService
from app.agents.orchestrator import AgentOrchestrator
from app.schemas.recommendation import (
    GenerateRecommendationRequest, RecommendationResponse, RecommendationCreate,
)
import json

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("/generate")
async def generate_recommendation(request: GenerateRecommendationRequest):
    """Generate a new AI stack recommendation using multi-agent analysis."""
    try:
        orchestrator = AgentOrchestrator()
        analysis = await orchestrator.full_analysis(request.organization_id)

        # Store as a formal recommendation
        rec_service = RecommendationService()
        rec = await rec_service.create(RecommendationCreate(
            organization_id=request.organization_id,
            recommended_tools=json.dumps(analysis.get("research", {}).get("recommended_tools", [])),
            reasoning_summary=json.dumps(analysis.get("strategy", {})),
            workflow_alignment=json.dumps(analysis.get("workflow", {})),
            compatibility_score=analysis.get("research", {}).get("stack_compatibility", 0.0),
            roi_estimation=json.dumps(analysis.get("roi", {})),
            future_growth_prediction=json.dumps(analysis.get("trends", {})),
        ))

        return {
            "recommendation": rec,
            "full_analysis": analysis,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{org_id}", response_model=list[RecommendationResponse])
async def get_recommendations(org_id: str):
    """Get all recommendations for an organization."""
    service = RecommendationService()
    return await service.get_for_organization(org_id)


@router.get("/{org_id}/latest")
async def get_latest_recommendation(org_id: str):
    """Get the most recent recommendation for an organization."""
    service = RecommendationService()
    result = await service.get_latest_for_org(org_id)
    if not result:
        return {"message": "No recommendations yet", "recommendation": None}
    return result
