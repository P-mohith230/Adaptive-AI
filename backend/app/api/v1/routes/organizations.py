"""
AdaptiveAI — Organization Routes
====================================
"""

from fastapi import APIRouter, HTTPException, Depends
from app.services.organization_service import OrganizationService
from app.services.digital_twin_service import DigitalTwinService
from app.services.scraper_service import ScraperService
from app.agents.orchestrator import AgentOrchestrator
from app.schemas.organization import (
    OrganizationCreate, OrganizationResponse, OnboardingData, OrganizationDashboard, WebScrapeRequest,
)
from app.schemas.user import UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.post("", response_model=OrganizationResponse)
async def create_organization(data: OrganizationCreate):
    """Create a new organization."""
    service = OrganizationService()
    return await service.create(data)


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(org_id: str):
    """Get organization details."""
    try:
        service = OrganizationService()
        return await service.get_by_id(org_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("", response_model=list[OrganizationResponse])
async def list_organizations():
    """List all organizations."""
    service = OrganizationService()
    return await service.list_all()


@router.post("/{org_id}/onboard", response_model=OrganizationResponse)
async def process_onboarding(org_id: str, data: OnboardingData):
    """Process the 6-step onboarding flow and trigger initial AI analysis."""
    try:
        org_service = OrganizationService()
        result = await org_service.process_onboarding(org_id, data)

        warnings = []

        # Trigger async full analysis in background
        try:
            orchestrator = AgentOrchestrator()
            await orchestrator.full_analysis(org_id)
        except Exception as e:
            import logging
            logging.getLogger("onboarding").error(f"Agent analysis failed for {org_id}: {e}")
            warnings.append(f"Agent analysis partially failed: {str(e)[:100]}")

        # Generate digital twin
        try:
            twin_service = DigitalTwinService()
            await twin_service.generate_mock_twin(org_id)
        except Exception as e:
            import logging
            logging.getLogger("onboarding").error(f"Digital twin failed for {org_id}: {e}")
            warnings.append(f"Digital twin generation skipped: {str(e)[:100]}")

        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{org_id}/scrape")
async def scrape_organization_website(org_id: str, data: WebScrapeRequest):
    """
    Crawls a startup landing page website, extracts all key operational details
    via Llama reasoning, commits it to Google Sheets, and runs the Multi-Agent orchestrator pipeline.
    """
    try:
        scraper = ScraperService()
        dashboard_data = await scraper.scrape_and_analyze(org_id, data.url)
        return dashboard_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{org_id}/dashboard", response_model=OrganizationDashboard)
async def get_dashboard(org_id: str):
    """Get aggregated dashboard data for an organization."""
    try:
        service = OrganizationService()
        return await service.get_dashboard(org_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{org_id}")
async def update_organization(org_id: str, data: dict):
    """Update organization fields."""
    try:
        service = OrganizationService()
        return await service.update(org_id, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
