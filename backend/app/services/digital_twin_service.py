"""
AdaptiveAI — Digital Twin Service
====================================
Manages organizational digital twins — virtual intelligence 
representations of an org's AI infrastructure and operational structure.
"""

import json
from datetime import datetime
from typing import Optional

from app.storage.sheet_manager import get_sheet_manager
from app.schemas.digital_twin import (
    DigitalTwinCreate, DigitalTwinInDB, DigitalTwinResponse,
)
from app.core.exceptions import RecordNotFoundError
from app.core.logging import get_logger

logger = get_logger("digital_twin_service")


class DigitalTwinService:
    """Manages organizational digital twin models."""

    def __init__(self):
        self.sheets = get_sheet_manager()

    async def create_or_update(self, org_id: str, twin_data: dict) -> DigitalTwinResponse:
        """Create or update the digital twin for an organization."""
        existing = await self.sheets.digital_twins.find_by_field("organization_id", org_id)

        data = {
            "organization_id": org_id,
            "workflow_map": json.dumps(twin_data.get("workflow_map", {})),
            "operational_structure": json.dumps(twin_data.get("operational_structure", {})),
            "bottlenecks": json.dumps(twin_data.get("bottlenecks", [])),
            "ai_adoption_state": json.dumps(twin_data.get("ai_adoption_state", {})),
            "optimization_predictions": json.dumps(twin_data.get("optimization_predictions", {})),
        }

        if existing:
            twin_id = existing[0].get("twin_id", "")
            await self.sheets.digital_twins.update(twin_id, data)
            logger.info(f"Updated digital twin for org {org_id}")
        else:
            twin = DigitalTwinInDB(**data)
            await self.sheets.digital_twins.insert(twin.model_dump())
            twin_id = twin.twin_id
            logger.info(f"Created digital twin for org {org_id}")

        result = await self.sheets.digital_twins.find_by_id(twin_id)
        return self._to_response(result)

    async def get_for_organization(self, org_id: str) -> Optional[DigitalTwinResponse]:
        """Get the digital twin for an organization."""
        records = await self.sheets.digital_twins.find_by_field("organization_id", org_id)
        if not records:
            return None
        return self._to_response(records[0])

    async def generate_mock_twin(self, org_id: str) -> DigitalTwinResponse:
        """Generate a mock digital twin for demo purposes."""
        # Get org data to personalize the twin
        org_data = await self.sheets.organizations.find_by_id(org_id)
        org_name = org_data.get("organization_name", "Organization") if org_data else "Organization"

        twin_data = {
            "workflow_map": {
                "nodes": [
                    {"id": "dev", "label": "Development", "type": "department", "ai_coverage": 0.72},
                    {"id": "mkt", "label": "Marketing", "type": "department", "ai_coverage": 0.45},
                    {"id": "sales", "label": "Sales", "type": "department", "ai_coverage": 0.38},
                    {"id": "support", "label": "Support", "type": "department", "ai_coverage": 0.55},
                    {"id": "ops", "label": "Operations", "type": "department", "ai_coverage": 0.30},
                ],
                "edges": [
                    {"from": "dev", "to": "ops", "label": "deployment"},
                    {"from": "mkt", "to": "sales", "label": "leads"},
                    {"from": "sales", "to": "support", "label": "onboarding"},
                    {"from": "support", "to": "dev", "label": "feedback"},
                ],
            },
            "operational_structure": {
                "name": org_name,
                "departments": ["Engineering", "Marketing", "Sales", "Support", "Operations"],
                "total_workflows": 24,
                "ai_automated_workflows": 8,
            },
            "bottlenecks": [
                {"area": "Code Review", "severity": "high", "department": "Engineering"},
                {"area": "Content Creation", "severity": "medium", "department": "Marketing"},
                {"area": "Lead Qualification", "severity": "high", "department": "Sales"},
                {"area": "Ticket Triage", "severity": "medium", "department": "Support"},
            ],
            "ai_adoption_state": {
                "overall_maturity": 0.48,
                "departments": {
                    "Engineering": {"maturity": 0.72, "tools": ["GitHub Copilot", "Linear"]},
                    "Marketing": {"maturity": 0.45, "tools": ["Jasper"]},
                    "Sales": {"maturity": 0.38, "tools": []},
                    "Support": {"maturity": 0.55, "tools": ["Intercom"]},
                    "Operations": {"maturity": 0.30, "tools": ["Zapier"]},
                },
            },
            "optimization_predictions": {
                "potential_efficiency_gain": 0.42,
                "priority_automations": [
                    "Automated code review triage",
                    "AI-powered lead scoring",
                    "Intelligent ticket routing",
                ],
                "estimated_roi_12_months": 185000,
            },
        }

        return await self.create_or_update(org_id, twin_data)

    def _to_response(self, data: dict) -> DigitalTwinResponse:
        return DigitalTwinResponse(
            twin_id=data.get("twin_id", ""),
            organization_id=data.get("organization_id", ""),
            workflow_map=str(data.get("workflow_map", "")),
            operational_structure=str(data.get("operational_structure", "")),
            bottlenecks=str(data.get("bottlenecks", "")),
            ai_adoption_state=str(data.get("ai_adoption_state", "")),
            optimization_predictions=str(data.get("optimization_predictions", "")),
            created_at=data.get("created_at", datetime.utcnow()),
        )
