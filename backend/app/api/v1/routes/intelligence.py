"""
AdaptiveAI — Intelligence Routes (Digital Twin + Evolution)
=============================================================
"""

from fastapi import APIRouter, HTTPException
from app.services.digital_twin_service import DigitalTwinService
from app.intelligence.engines import EvolutionEngine, ObsolescenceDetector

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])


@router.get("/twin/{org_id}")
async def get_digital_twin(org_id: str):
    """Get the digital twin for an organization."""
    service = DigitalTwinService()
    twin = await service.get_for_organization(org_id)
    if not twin:
        # Generate one on-demand
        twin = await service.generate_mock_twin(org_id)
    return twin


@router.post("/twin/{org_id}/generate")
async def generate_digital_twin(org_id: str):
    """Force regenerate the digital twin."""
    service = DigitalTwinService()
    return await service.generate_mock_twin(org_id)


@router.get("/evolution/{org_id}")
async def get_evolution_predictions(org_id: str):
    """Get AI evolution predictions for an organization."""
    from app.storage.sheet_manager import get_sheet_manager
    sheets = get_sheet_manager()
    org = await sheets.organizations.find_by_id(org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    engine = EvolutionEngine()
    return await engine.predict_evolution(org)


@router.get("/obsolescence/{org_id}")
async def check_obsolescence(org_id: str):
    """Check for obsolete AI tools in org's stack."""
    detector = ObsolescenceDetector()
    return await detector.scan(org_id)
