"""
AdaptiveAI — Organization Service
====================================
Core business logic for organization management.
Handles CRUD, onboarding processing, and AI maturity scoring.
"""

import json
from datetime import datetime
from typing import Optional, Any

from app.storage.sheet_manager import get_sheet_manager
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationInDB,
    OrganizationResponse,
    OnboardingData,
    OrganizationDashboard,
)
from app.core.exceptions import OrganizationNotFoundError, RecordNotFoundError
from app.core.logging import get_logger

logger = get_logger("organization_service")


class OrganizationService:
    """Manages organization lifecycle, onboarding, and intelligence."""

    def __init__(self):
        self.sheets = get_sheet_manager()

    async def create(self, data: OrganizationCreate) -> OrganizationResponse:
        """Create a new organization."""
        org = OrganizationInDB(**data.model_dump())
        await self.sheets.organizations.insert(org.model_dump())
        logger.info(f"Created organization: {org.organization_name} ({org.organization_id})")
        return self._to_response(org.model_dump())

    async def get_by_id(self, org_id: str) -> OrganizationResponse:
        """Get organization by ID."""
        data = await self.sheets.organizations.find_by_id(org_id)
        if not data:
            raise OrganizationNotFoundError(f"Organization {org_id} not found")
        return self._to_response(data)

    async def list_all(self, limit: int = 50) -> list[OrganizationResponse]:
        """List all organizations."""
        records = await self.sheets.organizations.find_all(limit=limit)
        return [self._to_response(r) for r in records]

    async def update(self, org_id: str, data: dict) -> OrganizationResponse:
        """Update organization fields and trigger dynamic multi-agent analysis."""
        # Convert numeric fields if passed in string format or if empty
        for num_field in ["team_size", "monthly_manual_hours", "employee_hourly_rate", "annual_ai_budget"]:
            if num_field in data:
                val = data[num_field]
                if val is None or str(val).strip() == "":
                    data[num_field] = 1 if num_field == "team_size" else 0.0
                else:
                    try:
                        if num_field == "team_size":
                            data[num_field] = int(float(val))
                        else:
                            data[num_field] = float(val)
                    except (ValueError, TypeError):
                        data[num_field] = 1 if num_field == "team_size" else 0.0

        await self.sheets.organizations.update(org_id, data)

        # Trigger multi-agent pipeline and digital twin rebuild synchronously to calculate fresh stats and write to Excel
        try:
            from app.agents.orchestrator import AgentOrchestrator
            from app.services.digital_twin_service import DigitalTwinService
            from app.services.recommendation_service import RecommendationService
            from app.schemas.recommendation import RecommendationCreate

            orchestrator = AgentOrchestrator()
            analysis = await orchestrator.full_analysis(org_id)

            # Persist the dynamic recalculated ROI and recommendations directly into Excel
            rec_service = RecommendationService()
            await rec_service.create(RecommendationCreate(
                organization_id=org_id,
                recommended_tools=json.dumps(analysis.get("research", {}).get("recommended_tools", [])),
                reasoning_summary=json.dumps(analysis.get("strategy", {})),
                workflow_alignment=json.dumps(analysis.get("workflow", {})),
                compatibility_score=analysis.get("research", {}).get("stack_compatibility", 0.0),
                roi_estimation=json.dumps(analysis.get("roi", {})),
                future_growth_prediction=json.dumps(analysis.get("trends", {})),
            ))

            twin_service = DigitalTwinService()
            await twin_service.generate_mock_twin(org_id)
        except Exception as e:
            logger.error(f"Failed to auto-trigger multi-agent recalculation chain on org update: {e}")

        # Physically re-read the updated organization row from Excel sheet (database)
        updated = await self.sheets.organizations.find_by_id(org_id)
        return self._to_response(updated)

    async def process_onboarding(self, org_id: str, onboarding: OnboardingData) -> OrganizationResponse:
        """
        Process the 6-step onboarding data.
        Computes initial AI maturity score and stores all organizational context.
        """
        # Calculate AI maturity score from self-assessment and data completeness
        maturity = self._calculate_ai_maturity(onboarding)

        update_data = {
            "organization_name": onboarding.organization_name,
            "startup_type": onboarding.startup_type,
            "team_size": onboarding.team_size,
            "workflows": onboarding.workflows,
            "pain_points": onboarding.pain_points,
            "current_ai_tools": onboarding.current_ai_tools,
            "automation_goals": onboarding.automation_goals,
            "monthly_manual_hours": onboarding.monthly_manual_hours or 0.0,
            "employee_hourly_rate": onboarding.employee_hourly_rate or 0.0,
            "annual_ai_budget": onboarding.annual_ai_budget or 0.0,
            "ai_maturity_score": maturity,
        }

        try:
            await self.sheets.organizations.update(org_id, update_data)
        except RecordNotFoundError:
            raise OrganizationNotFoundError(f"Organization {org_id} not found")

        logger.info(f"Processed onboarding for org {org_id} - maturity score: {maturity:.2f}")
        return await self.get_by_id(org_id)

    def _calculate_ai_maturity(self, data: OnboardingData) -> float:
        """
        Calculate AI maturity score (0.0 - 1.0) based on:
        - Self-assessment score (weighted 40%)
        - Number of current AI tools (weighted 30%)
        - Clarity of workflows & goals (weighted 30%)
        """
        # Self-assessment (1-10 → normalized to 0-1)
        self_score = data.ai_maturity_self_score / 10.0

        # AI tool adoption
        tools = [t.strip() for t in data.current_ai_tools.split(",") if t.strip()]
        tool_score = min(len(tools) / 8.0, 1.0)  # Cap at 8 tools for max score

        # Data completeness
        completeness = 0
        if data.workflows.strip():
            completeness += 0.25
        if data.pain_points.strip():
            completeness += 0.25
        if data.automation_goals.strip():
            completeness += 0.25
        if data.departments.strip():
            completeness += 0.25

        maturity = (self_score * 0.4) + (tool_score * 0.3) + (completeness * 0.3)
        return round(min(max(maturity, 0.0), 1.0), 2)

    async def get_dashboard(self, org_id: str) -> OrganizationDashboard:
        """Get aggregated dashboard data for an organization."""
        org = await self.get_by_id(org_id)

        # Count active recommendations
        recs = await self.sheets.recommendations.find_by_field("organization_id", org_id)
        
        # Count active alerts
        alerts = await self.sheets.alerts.find_by_field("organization_id", org_id)
        active_alerts = [a for a in alerts if not a.get("is_dismissed", False)]

        return OrganizationDashboard(
            organization=org,
            ai_maturity_score=org.ai_maturity_score,
            workflow_bottleneck_count=len(org.pain_points.split(",")) if org.pain_points else 0,
            active_recommendations=len(recs),
            active_alerts=len(active_alerts),
            roi_potential=0.0,  # Calculated by ROI agent
        )

    def _to_response(self, data: dict) -> OrganizationResponse:
        """Convert raw dict to OrganizationResponse."""
        def safe_float(val: Any, default: float = 0.0) -> float:
            if val is None or val == "":
                return default
            try:
                return float(val)
            except (ValueError, TypeError):
                return default

        def safe_int(val: Any, default: int = 1) -> int:
            if val is None or val == "":
                return default
            try:
                return int(float(val))
            except (ValueError, TypeError):
                return default

        return OrganizationResponse(
            organization_id=data.get("organization_id", ""),
            organization_name=data.get("organization_name", ""),
            startup_type=data.get("startup_type", ""),
            team_size=safe_int(data.get("team_size"), 1),
            ai_maturity_score=safe_float(data.get("ai_maturity_score"), 0.0),
            workflows=str(data.get("workflows", "")),
            pain_points=str(data.get("pain_points", "")),
            current_ai_tools=str(data.get("current_ai_tools", "")),
            automation_goals=str(data.get("automation_goals", "")),
            monthly_manual_hours=safe_float(data.get("monthly_manual_hours"), 0.0),
            employee_hourly_rate=safe_float(data.get("employee_hourly_rate"), 0.0),
            annual_ai_budget=safe_float(data.get("annual_ai_budget"), 0.0),
            created_at=data.get("created_at", datetime.utcnow()),
        )
