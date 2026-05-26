"""
AdaptiveAI — Market Intelligence Schema
==========================================
Maps to MARKET_INTELLIGENCE_MASTER.xlsx
Stores processed market signals from Reddit, GitHub, ProductHunt, etc.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid


class MarketIntelligenceBase(BaseModel):
    source_type: str = Field(..., description="reddit, github, producthunt, news, hackernews")
    source_name: str = Field(default="", description="Specific source identifier")
    tool_name: str = Field(default="", description="Related AI tool if applicable")
    sentiment_score: float = Field(default=0.0, ge=-1.0, le=1.0)
    trend_velocity: float = Field(default=0.0, ge=0.0, le=1.0)
    community_mentions: int = Field(default=0, ge=0)
    github_growth: float = Field(default=0.0)
    producthunt_rank: int = Field(default=0, ge=0)
    funding_activity: str = Field(default="", description="Recent funding info")


class MarketIntelligenceCreate(MarketIntelligenceBase):
    pass


class MarketIntelligenceInDB(MarketIntelligenceBase):
    intelligence_id: str = Field(default_factory=lambda: f"int_{uuid.uuid4().hex[:12]}")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MarketIntelligenceResponse(BaseModel):
    intelligence_id: str
    source_type: str
    source_name: str
    tool_name: str
    sentiment_score: float
    trend_velocity: float
    community_mentions: int
    github_growth: float
    producthunt_rank: int
    funding_activity: str
    created_at: datetime


class MarketTrendSummary(BaseModel):
    """Aggregated market trend data for dashboard."""
    trending_tools: list[dict] = []
    emerging_categories: list[str] = []
    declining_categories: list[str] = []
    ecosystem_health_score: float = 0.0
    total_signals_processed: int = 0
