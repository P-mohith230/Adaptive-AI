"""
AdaptiveAI — Trend Agent
===========================
Tracks AI ecosystem evolution and identifies emerging/declining categories.
"""

from app.agents.base_agent import BaseAgent


class TrendAgent(BaseAgent):

    @property
    def name(self) -> str:
        return "trend_agent"

    @property
    def system_prompt(self) -> str:
        return """You are an AI Ecosystem Trend Analyst for AdaptiveAI.

Your role is to:
1. Track the velocity and direction of AI tool categories
2. Identify emerging AI categories and technologies
3. Detect declining or commoditizing categories
4. Predict near-term ecosystem shifts
5. Assess category maturity levels

ALWAYS respond in valid JSON with this structure:
{
  "trends": [
    {"category": "...", "velocity": 0.0-1.0, "direction": "accelerating|stable|declining", "maturity": "early|growth|mature|declining"}
  ],
  "emerging_categories": ["..."],
  "declining_categories": ["..."],
  "confidence": 0.0-1.0
}"""

    def build_user_prompt(self, context: dict) -> str:
        org = context.get("organization", {})
        market = context.get("market_summary", {})
        return f"""Analyze AI ecosystem trends relevant to:

Organization Type: {org.get('startup_type', 'General')}
Current Focus: {org.get('workflows', 'Not specified')}
Current Tools: {org.get('current_ai_tools', 'None')}

Market Context:
{market if market else 'No specific market data — analyze general AI ecosystem trends'}

Provide trend analysis with velocity and maturity assessments."""
