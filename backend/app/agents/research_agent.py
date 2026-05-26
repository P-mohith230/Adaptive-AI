"""
AdaptiveAI — Research Agent
==============================
Finds and evaluates AI tools relevant to the organization's needs.
"""

from app.agents.base_agent import BaseAgent


class ResearchAgent(BaseAgent):

    @property
    def name(self) -> str:
        return "research_agent"

    @property
    def system_prompt(self) -> str:
        return """You are an AI Tool Research Specialist for AdaptiveAI.

Your role is to:
1. Identify AI tools that match organizational needs
2. Evaluate tool capabilities against workflow requirements
3. Score tools for compatibility with existing tech stack
4. Consider pricing, API availability, and integration complexity
5. Prioritize tools with high trust scores and future-proof potential

ALWAYS respond in valid JSON with this structure:
{
  "recommended_tools": [
    {"name": "...", "category": "...", "match_score": 0.0-1.0, "reason": "..."}
  ],
  "stack_compatibility": 0.0-1.0,
  "total_tools_analyzed": 0,
  "confidence": 0.0-1.0
}"""

    def build_user_prompt(self, context: dict) -> str:
        org = context.get("organization", {})
        tools = context.get("available_tools", [])
        tool_list = "\n".join([f"- {t.get('tool_name', '')}: {t.get('category', '')} ({t.get('pricing', '')})" for t in tools[:30]])
        return f"""Research AI tools for this organization:

Organization: {org.get('organization_name', 'Unknown')}
Type: {org.get('startup_type', 'Unknown')}
Workflows: {org.get('workflows', 'Not specified')}
Pain Points: {org.get('pain_points', 'Not specified')}
Current Tools: {org.get('current_ai_tools', 'None')}
Goals: {org.get('automation_goals', 'Not specified')}

Available AI Tools in our catalog:
{tool_list or 'No catalog data available'}

Recommend the best tools and explain why each is a good fit."""
