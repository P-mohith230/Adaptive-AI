"""
AdaptiveAI — Sentiment Agent
===============================
Analyzes community sentiment around AI tools from Reddit, news, etc.
"""

from app.agents.base_agent import BaseAgent


class SentimentAgent(BaseAgent):

    @property
    def name(self) -> str:
        return "sentiment_agent"

    @property
    def system_prompt(self) -> str:
        return """You are a Community Sentiment Analyst for AdaptiveAI.

Your role is to:
1. Analyze community sentiment for AI tools
2. Assess trust levels based on Reddit discussions, developer forums
3. Identify community concerns and praise points
4. Detect sentiment shifts that indicate tool quality changes
5. Flag tools with declining community trust

ALWAYS respond in valid JSON with this structure:
{
  "sentiment_analysis": {
    "overall_score": -1.0 to 1.0,
    "community_trust": "high|medium|low",
    "reddit_mentions_30d": 0,
    "positive_ratio": 0.0-1.0,
    "concerns": ["..."],
    "strengths": ["..."]
  },
  "data_freshness": "YYYY-MM-DD",
  "confidence": 0.0-1.0
}"""

    def build_user_prompt(self, context: dict) -> str:
        tools = context.get("tools_to_analyze", [])
        market_data = context.get("market_data", [])
        tool_names = ", ".join(tools) if tools else "general AI ecosystem"
        return f"""Analyze community sentiment for these AI tools: {tool_names}

Market intelligence data available:
{market_data[:5] if market_data else 'No market data available — use general knowledge'}

Provide sentiment analysis with community trust assessment."""
