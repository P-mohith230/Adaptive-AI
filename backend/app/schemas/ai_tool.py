"""
AdaptiveAI — AI Tool Schema
==============================
Maps to AI_TOOLS_MASTER.xlsx
Represents the AI ecosystem catalog with intelligence scores.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid


class AIToolBase(BaseModel):
    tool_name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., description="e.g., Development, Design, Marketing, Operations")
    pricing: str = Field(default="", description="e.g., Free, Freemium, $20/mo, Enterprise")
    compatibility_tags: str = Field(default="", description="Comma-separated compatibility tags")
    api_support: str = Field(default="", description="e.g., REST, GraphQL, SDK, None")
    description: str = Field(default="")
    website: str = Field(default="")


class AIToolCreate(AIToolBase):
    pass


class AIToolInDB(AIToolBase):
    tool_id: str = Field(default_factory=lambda: f"tool_{uuid.uuid4().hex[:12]}")
    trust_score: float = Field(default=0.0, ge=0.0, le=1.0)
    future_proof_score: float = Field(default=0.0, ge=0.0, le=1.0)
    github_growth: float = Field(default=0.0, description="Growth rate in GitHub stars")
    reddit_sentiment: float = Field(default=0.0, ge=-1.0, le=1.0)
    market_velocity: float = Field(default=0.0, ge=0.0, le=1.0)
    security_score: float = Field(default=0.0, ge=0.0, le=1.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AIToolResponse(BaseModel):
    tool_id: str
    tool_name: str
    category: str
    pricing: str
    trust_score: float
    future_proof_score: float
    github_growth: float
    reddit_sentiment: float
    market_velocity: float
    compatibility_tags: str
    api_support: str
    security_score: float
    description: str = ""
    website: str = ""


class AIToolSearchParams(BaseModel):
    """Search/filter parameters for AI tools."""
    category: Optional[str] = None
    min_trust_score: Optional[float] = None
    min_future_proof_score: Optional[float] = None
    compatibility_tag: Optional[str] = None
    pricing_type: Optional[str] = None
    search_query: Optional[str] = None
    limit: int = Field(default=20, ge=1, le=100)
