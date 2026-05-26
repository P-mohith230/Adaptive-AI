"""
AdaptiveAI — Intelligence Engines
====================================
Higher-order intelligence modules: market engine, evolution engine,
obsolescence detector, and trust index calculator.
"""

import json
from typing import Optional
from app.storage.sheet_manager import get_sheet_manager
from app.core.ai_client import get_ai_client
from app.core.logging import get_logger


logger = get_logger("intelligence")


def safe_float(val, default=0.0):
    if val is None or val == "":
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default



class MarketEngine:
    """Processes raw market data into actionable intelligence."""

    def __init__(self):
        self.sheets = get_sheet_manager()

    async def get_heatmap_data(self) -> dict:
        """Generate AI market heatmap data."""
        tools = await self.sheets.ai_tools.find_all()
        categories = {}
        for tool in tools:
            cat = str(tool.get("category", "Other"))
            if cat not in categories:
                categories[cat] = {"category": cat, "tools": [], "avg_velocity": 0, "avg_trust": 0}
            categories[cat]["tools"].append({
                "name": tool.get("tool_name", ""),
                "trust": safe_float(tool.get("trust_score", 0)),
                "velocity": safe_float(tool.get("market_velocity", 0)),
                "sentiment": safe_float(tool.get("reddit_sentiment", 0)),
            })
        for cat_data in categories.values():
            n = len(cat_data["tools"])
            if n > 0:
                cat_data["avg_velocity"] = round(sum(t["velocity"] for t in cat_data["tools"]) / n, 2)
                cat_data["avg_trust"] = round(sum(t["trust"] for t in cat_data["tools"]) / n, 2)
        return {"categories": list(categories.values()), "total_tools": len(tools)}


class EvolutionEngine:
    """Predicts future AI needs and generates organizational AI roadmaps."""

    def __init__(self):
        self.ai_client = get_ai_client()

    async def predict_evolution(self, org_data: dict) -> dict:
        """Generate AI evolution predictions for an organization."""
        response = await self.ai_client.generate(
            system_prompt="You are an AI Evolution Predictor. Predict future AI needs.",
            user_prompt=f"Predict AI evolution for: {json.dumps(org_data)}",
            response_format="json",
        )
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"prediction": response}


class ObsolescenceDetector:
    """Detects declining AI tools and recommends replacements."""

    def __init__(self):
        self.sheets = get_sheet_manager()
        self.ai_client = get_ai_client()

    async def scan(self, org_id: str) -> dict:
        """Scan org's AI stack for obsolescence risks."""
        org = await self.sheets.organizations.find_by_id(org_id)
        if not org:
            return {"error": "Organization not found"}

        current_tools = str(org.get("current_ai_tools", "")).split(",")
        current_tools = [t.strip() for t in current_tools if t.strip()]

        response = await self.ai_client.generate(
            system_prompt="You are an AI Obsolescence Detector. Analyze tools for decline risk.",
            user_prompt=f"Analyze obsolescence risk for these tools: {', '.join(current_tools)}",
            response_format="json",
        )
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"analysis": response}


class TrustIndex:
    """Computes composite trust scores for AI tools."""

    def __init__(self):
        self.sheets = get_sheet_manager()

    async def calculate(self, tool_id: str) -> dict:
        """Calculate trust index for a specific tool."""
        tool = await self.sheets.ai_tools.find_by_id(tool_id)
        if not tool:
            return {"error": "Tool not found"}

        # Composite trust score formula
        sentiment = safe_float(tool.get("reddit_sentiment", 0))
        github = safe_float(tool.get("github_growth", 0))
        security = safe_float(tool.get("security_score", 0))
        velocity = safe_float(tool.get("market_velocity", 0))

        # Weighted formula
        trust = (
            (sentiment + 1) / 2 * 0.25 +  # Normalize sentiment from [-1,1] to [0,1]
            min(github / 100, 1.0) * 0.20 +
            security * 0.30 +
            velocity * 0.25
        )

        return {
            "tool_id": tool_id,
            "tool_name": tool.get("tool_name", ""),
            "trust_index": round(trust, 2),
            "factors": {
                "community_sentiment": round((sentiment + 1) / 2, 2),
                "development_activity": round(min(github / 100, 1.0), 2),
                "security_posture": round(security, 2),
                "market_momentum": round(velocity, 2),
            },
        }
