"""
AdaptiveAI — Organization Schema
==================================
Maps to ORGANIZATIONS_MASTER.xlsx
Core entity for the platform — every intelligence flow centers on an organization.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid


class OrganizationBase(BaseModel):
    organization_name: str = Field(..., min_length=2, max_length=200)
    startup_type: str = Field(default="", description="e.g., SaaS, AI-native, E-commerce, Fintech")
    team_size: int = Field(default=1, ge=1)
    workflows: str = Field(default="", description="Comma-separated workflow descriptions")
    pain_points: str = Field(default="", description="Comma-separated pain points")
    current_ai_tools: str = Field(default="", description="Comma-separated current AI tools")
    automation_goals: str = Field(default="", description="Comma-separated automation goals")
    monthly_manual_hours: float = Field(default=0.0, ge=0.0)
    employee_hourly_rate: float = Field(default=0.0, ge=0.0)
    annual_ai_budget: float = Field(default=0.0, ge=0.0)


class OrganizationCreate(OrganizationBase):
    pass


class OnboardingData(BaseModel):
    """Data collected during the 6-step onboarding flow."""
    # Step 1: Organization details
    organization_name: str
    startup_type: str
    team_size: int

    # Step 2: Workflow analysis
    departments: str = Field(default="", description="Comma-separated department names")
    workflows: str = Field(default="", description="Key workflows description")

    # Step 3: Current AI tools
    current_ai_tools: str = Field(default="")

    # Step 4: Pain points
    pain_points: str = Field(default="")

    # Step 5: Operational goals
    automation_goals: str = Field(default="")

    # Step 6: AI maturity self-assessment
    ai_maturity_self_score: int = Field(default=3, ge=1, le=10)

    # Optional ROI and financial parameters
    monthly_manual_hours: Optional[float] = Field(default=0.0)
    employee_hourly_rate: Optional[float] = Field(default=0.0)
    annual_ai_budget: Optional[float] = Field(default=0.0)


class OrganizationInDB(OrganizationBase):
    organization_id: str = Field(default_factory=lambda: f"org_{uuid.uuid4().hex[:12]}")
    ai_maturity_score: float = Field(default=0.0, ge=0.0, le=1.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class OrganizationResponse(BaseModel):
    organization_id: str
    organization_name: str
    startup_type: str
    team_size: int
    ai_maturity_score: float
    workflows: str
    pain_points: str
    current_ai_tools: str
    automation_goals: str
    monthly_manual_hours: float
    employee_hourly_rate: float
    annual_ai_budget: float
    created_at: datetime


class OrganizationDashboard(BaseModel):
    """Aggregated dashboard data for an organization."""
    organization: OrganizationResponse
    ai_maturity_score: float
    workflow_bottleneck_count: int = 0
    active_recommendations: int = 0
    active_alerts: int = 0
    roi_potential: float = 0.0


class WebScrapeRequest(BaseModel):
    """Payload to request automated website scraping and Operational Extraction."""
    url: str = Field(..., description="URL of the company website to crawl and extract details from")
