"""
AdaptiveAI — Digital Twin Schema
===================================
Maps to DIGITAL_TWIN_MASTER.xlsx
Virtual intelligence representation of an organization's AI infrastructure.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid


class DigitalTwinBase(BaseModel):
    organization_id: str
    workflow_map: str = Field(default="", description="JSON workflow node structure")
    operational_structure: str = Field(default="", description="JSON department/team structure")
    bottlenecks: str = Field(default="", description="JSON identified bottlenecks")
    ai_adoption_state: str = Field(default="", description="JSON per-department AI adoption")
    optimization_predictions: str = Field(default="", description="JSON optimization opportunities")


class DigitalTwinCreate(DigitalTwinBase):
    pass


class DigitalTwinInDB(DigitalTwinBase):
    twin_id: str = Field(default_factory=lambda: f"twn_{uuid.uuid4().hex[:12]}")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DigitalTwinResponse(BaseModel):
    twin_id: str
    organization_id: str
    workflow_map: str
    operational_structure: str
    bottlenecks: str
    ai_adoption_state: str
    optimization_predictions: str
    created_at: datetime
