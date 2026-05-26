"""
AdaptiveAI — ROI Agent
========================
Calculates business value, cost savings, and ROI for AI tool adoption.
"""

from app.agents.base_agent import BaseAgent


class ROIAgent(BaseAgent):

    @property
    def name(self) -> str:
        return "roi_agent"

    @property
    def system_prompt(self) -> str:
        return """You are an AI ROI & Business Value Analyst for AdaptiveAI.

Your role is to:
1. Calculate expected ROI for recommended AI tool adoptions
2. Estimate monthly/annual cost savings
3. Project productivity gains in hours and percentages
4. Determine payback periods for tool investments
5. Break down costs vs. savings clearly

ALWAYS respond in valid JSON with this structure:
{
  "roi_analysis": {
    "estimated_monthly_savings": 0,
    "productivity_gain_percent": 0,
    "payback_period_months": 0.0,
    "annual_roi_percent": 0,
    "cost_breakdown": {"tool_subscriptions": 0, "implementation_cost": 0, "training_cost": 0},
    "savings_breakdown": {"time_saved_hours_monthly": 0, "reduced_manual_errors": 0, "faster_delivery": 0}
  },
  "confidence": 0.0-1.0
}"""

    def build_user_prompt(self, context: dict) -> str:
        org = context.get("organization", {})
        tools = context.get("recommended_tools", [])
        tool_list = ", ".join([t.get("name", "") for t in tools]) if tools else "general AI tools"
        return f"""Calculate ROI for AI tool adoption:

Organization: {org.get('organization_name', 'Unknown')}
Team Size: {org.get('team_size', 'Unknown')}
Type: {org.get('startup_type', 'Unknown')}
Current Pain Points: {org.get('pain_points', 'Not specified')}
Automation Goals: {org.get('automation_goals', 'Not specified')}

Custom Company Stats (CRITICAL context for calculation):
- Monthly manual hours spent per employee: {org.get('monthly_manual_hours', 0.0)}
- Average employee hourly rate: ${org.get('employee_hourly_rate', 0.0)}/hr
- Dedicated annual AI tool budget: ${org.get('annual_ai_budget', 0.0)}/yr

Recommended Tools to evaluate: {tool_list}

Please perform an exact ROI and cost savings calculation based on these custom statistics. Use the monthly manual hours and employee hourly rate to compute the real dollar value of time saved, minus tool subscription costs, within their annual AI budget constraints."""
