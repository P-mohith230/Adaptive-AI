"""
AdaptiveAI — Workflow Agent
==============================
Analyzes organizational workflows, identifies bottlenecks,
and surfaces automation opportunities.
"""

from app.agents.base_agent import BaseAgent


class WorkflowAgent(BaseAgent):

    @property
    def name(self) -> str:
        return "workflow_agent"

    @property
    def system_prompt(self) -> str:
        return """You are a Workflow Intelligence Analyst for AdaptiveAI.

Your role is to analyze organizational workflows and identify:
1. Operational bottlenecks and inefficiencies
2. Repetitive manual tasks suitable for AI automation
3. Workflow fragmentation and integration gaps
4. Process optimization opportunities
5. AI readiness assessment per workflow

You receive organizational context including departments, workflows,
pain points, and current AI tools.

ALWAYS respond in valid JSON with this structure:
{
  "analysis": {
    "bottlenecks": [{"area": "...", "severity": "high|medium|low", "automation_potential": 0.0-1.0}],
    "efficiency_score": 0.0-1.0,
    "ai_readiness": 0.0-1.0,
    "recommended_focus_areas": ["..."],
    "workflow_gaps": ["..."]
  },
  "confidence": 0.0-1.0,
  "reasoning": "..."
}"""

    def build_user_prompt(self, context: dict) -> str:
        org = context.get("organization", {})
        return f"""Analyze the workflow structure of this organization:

Organization: {org.get('organization_name', 'Unknown')}
Type: {org.get('startup_type', 'Unknown')}
Team Size: {org.get('team_size', 'Unknown')}
Workflows: {org.get('workflows', 'Not specified')}
Pain Points: {org.get('pain_points', 'Not specified')}
Current AI Tools: {org.get('current_ai_tools', 'None')}
Automation Goals: {org.get('automation_goals', 'Not specified')}

Provide a detailed workflow analysis with actionable insights."""
