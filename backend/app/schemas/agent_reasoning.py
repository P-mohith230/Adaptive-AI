"""
AdaptiveAI — Agent Reasoning Schema
======================================
Maps to AGENT_REASONING_MASTER.xlsx
Stores the reasoning chain from multi-agent orchestration.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid


class AgentReasoningBase(BaseModel):
    organization_id: str
    query: str = Field(default="", description="Original user query or trigger")
    workflow_agent_output: str = Field(default="", description="JSON workflow analysis")
    research_agent_output: str = Field(default="", description="JSON tool research")
    sentiment_agent_output: str = Field(default="", description="JSON sentiment analysis")
    trend_agent_output: str = Field(default="", description="JSON trend analysis")
    roi_agent_output: str = Field(default="", description="JSON ROI estimation")
    strategy_agent_output: str = Field(default="", description="JSON strategic synthesis")
    final_synthesis: str = Field(default="", description="Final combined recommendation")


class AgentReasoningCreate(AgentReasoningBase):
    pass


class AgentReasoningInDB(AgentReasoningBase):
    reasoning_id: str = Field(default_factory=lambda: f"rsn_{uuid.uuid4().hex[:12]}")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AgentReasoningResponse(BaseModel):
    reasoning_id: str
    organization_id: str
    query: str
    workflow_agent_output: str
    research_agent_output: str
    sentiment_agent_output: str
    trend_agent_output: str
    roi_agent_output: str
    strategy_agent_output: str
    final_synthesis: str
    created_at: datetime


class ConsultRequest(BaseModel):
    """Request to the AI consultant chat."""
    message: str = Field(..., min_length=1, max_length=5000)
    organization_id: str
    conversation_context: Optional[str] = Field(default=None, description="Previous conversation context")


class ConsultResponse(BaseModel):
    """Response from the AI consultant."""
    response: str
    reasoning_id: str
    agents_used: list[str] = []
    confidence: float = 0.0
    follow_up_suggestions: list[str] = []
