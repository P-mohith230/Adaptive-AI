"""
AdaptiveAI — Alert Schema
============================
Maps to ALERTS_MASTER.xlsx
Tracks AI ecosystem alerts: obsolescence, emerging tools, replacements.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid


class AlertBase(BaseModel):
    organization_id: str
    alert_type: str = Field(..., description="obsolescence, emerging, replacement, security, pricing")
    alert_message: str = Field(default="")
    replacement_tool: str = Field(default="", description="Suggested replacement if applicable")
    severity: str = Field(default="medium", description="low, medium, high, critical")
    market_change_trigger: str = Field(default="", description="What market event triggered this alert")


class AlertCreate(AlertBase):
    pass


class AlertInDB(AlertBase):
    alert_id: str = Field(default_factory=lambda: f"alt_{uuid.uuid4().hex[:12]}")
    is_dismissed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AlertResponse(BaseModel):
    alert_id: str
    organization_id: str
    alert_type: str
    alert_message: str
    replacement_tool: str
    severity: str
    market_change_trigger: str
    is_dismissed: bool
    created_at: datetime
