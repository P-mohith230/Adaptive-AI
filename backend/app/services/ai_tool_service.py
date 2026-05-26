"""
AdaptiveAI — AI Tool Service
===============================
Manages the AI tool catalog with intelligence scoring.
"""

from datetime import datetime
from typing import Optional

from app.storage.sheet_manager import get_sheet_manager
from app.schemas.ai_tool import AIToolCreate, AIToolInDB, AIToolResponse, AIToolSearchParams
from app.core.exceptions import RecordNotFoundError
from app.core.logging import get_logger

logger = get_logger("ai_tool_service")



def safe_float(val, default=0.0):
    if val is None or val == "":
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def safe_int(val, default=0):
    if val is None or val == "":
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default


class AIToolService:
    """Manages the AI tool catalog, scoring, and search."""

    def __init__(self):
        self.sheets = get_sheet_manager()

    async def create(self, data: AIToolCreate) -> AIToolResponse:
        """Add a new AI tool to the catalog."""
        tool = AIToolInDB(**data.model_dump())
        await self.sheets.ai_tools.insert(tool.model_dump())
        logger.info(f"Added AI tool: {tool.tool_name}")
        return self._to_response(tool.model_dump())

    async def get_by_id(self, tool_id: str) -> AIToolResponse:
        """Get an AI tool by ID."""
        data = await self.sheets.ai_tools.find_by_id(tool_id)
        if not data:
            raise RecordNotFoundError(f"AI tool {tool_id} not found")
        return self._to_response(data)

    async def list_all(self, limit: int = 50) -> list[AIToolResponse]:
        """List all AI tools."""
        records = await self.sheets.ai_tools.find_all(limit=limit)
        return [self._to_response(r) for r in records]

    async def search(self, params: AIToolSearchParams) -> list[AIToolResponse]:
        """Search AI tools with filters."""
        filters = {}
        if params.category:
            filters["category"] = params.category

        records = await self.sheets.ai_tools.find_all(
            filters=filters if filters else None,
            limit=params.limit,
        )

        # Apply additional filters that require more complex logic
        results = records

        if params.min_trust_score is not None:
            results = [r for r in results if safe_float(r.get("trust_score", 0)) >= params.min_trust_score]

        if params.min_future_proof_score is not None:
            results = [r for r in results if safe_float(r.get("future_proof_score", 0)) >= params.min_future_proof_score]

        if params.compatibility_tag:
            tag = params.compatibility_tag.lower()
            results = [r for r in results if tag in str(r.get("compatibility_tags", "")).lower()]

        if params.search_query:
            query = params.search_query.lower()
            results = [
                r for r in results
                if query in str(r.get("tool_name", "")).lower()
                or query in str(r.get("category", "")).lower()
                or query in str(r.get("description", "")).lower()
            ]

        return [self._to_response(r) for r in results]

    async def get_categories(self) -> list[dict]:
        """Get all unique categories with tool counts."""
        all_tools = await self.sheets.ai_tools.find_all()
        categories = {}
        for tool in all_tools:
            cat = str(tool.get("category", "Uncategorized"))
            if cat not in categories:
                categories[cat] = {"category": cat, "count": 0, "avg_trust_score": 0.0}
            categories[cat]["count"] += 1
            categories[cat]["avg_trust_score"] += safe_float(tool.get("trust_score", 0))

        for cat in categories.values():
            if cat["count"] > 0:
                cat["avg_trust_score"] = round(cat["avg_trust_score"] / cat["count"], 2)

        return sorted(categories.values(), key=lambda x: x["count"], reverse=True)

    async def update_scores(self, tool_id: str, scores: dict) -> AIToolResponse:
        """Update intelligence scores for a tool."""
        allowed = {"trust_score", "future_proof_score", "github_growth",
                    "reddit_sentiment", "market_velocity", "security_score"}
        filtered = {k: v for k, v in scores.items() if k in allowed}
        await self.sheets.ai_tools.update(tool_id, filtered)
        return await self.get_by_id(tool_id)

    async def get_compatible_tools(self, tags: list[str], limit: int = 10) -> list[AIToolResponse]:
        """Find tools compatible with given tags."""
        all_tools = await self.sheets.ai_tools.find_all()
        scored = []
        for tool in all_tools:
            tool_tags = str(tool.get("compatibility_tags", "")).lower().split(",")
            tool_tags = [t.strip() for t in tool_tags]
            match_count = sum(1 for tag in tags if tag.lower() in tool_tags)
            if match_count > 0:
                scored.append((match_count, tool))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [self._to_response(t) for _, t in scored[:limit]]

    def _to_response(self, data: dict) -> AIToolResponse:
        return AIToolResponse(
            tool_id=data.get("tool_id", ""),
            tool_name=data.get("tool_name", ""),
            category=data.get("category", ""),
            pricing=str(data.get("pricing", "")),
            trust_score=safe_float(data.get("trust_score", 0)),
            future_proof_score=safe_float(data.get("future_proof_score", 0)),
            github_growth=safe_float(data.get("github_growth", 0)),
            reddit_sentiment=safe_float(data.get("reddit_sentiment", 0)),
            market_velocity=safe_float(data.get("market_velocity", 0)),
            compatibility_tags=str(data.get("compatibility_tags", "")),
            api_support=str(data.get("api_support", "")),
            security_score=safe_float(data.get("security_score", 0)),
            description=str(data.get("description", "")),
            website=str(data.get("website", "")),
        )
