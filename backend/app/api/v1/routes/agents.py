"""
AdaptiveAI — Agent Routes (AI Consultant Chat + Analysis)
============================================================
"""

from fastapi import APIRouter, HTTPException
from app.agents.orchestrator import AgentOrchestrator
from app.schemas.agent_reasoning import ConsultRequest, ConsultResponse
from app.storage.sheet_manager import get_sheet_manager

router = APIRouter(prefix="/agents", tags=["AI Agents"])


@router.post("/consult", response_model=ConsultResponse)
async def ai_consultant(request: ConsultRequest):
    """Chat with the AI consultant — triggers multi-agent reasoning."""
    try:
        orchestrator = AgentOrchestrator()
        return await orchestrator.consult(
            message=request.message,
            org_id=request.organization_id,
            conversation_context=request.conversation_context,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent consultation failed: {str(e)}")


@router.post("/analyze/{org_id}")
async def full_analysis(org_id: str):
    """Trigger a full organizational AI analysis using all agents."""
    try:
        orchestrator = AgentOrchestrator()
        result = await orchestrator.full_analysis(org_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Full analysis failed for {org_id}: {str(e)}")


@router.get("/reasoning/{org_id}")
async def get_reasoning_history(org_id: str):
    """Get reasoning history for an organization."""
    sheets = get_sheet_manager()
    records = await sheets.agent_reasoning.find_by_field("organization_id", org_id)
    return {"reasoning_history": records, "total": len(records)}
