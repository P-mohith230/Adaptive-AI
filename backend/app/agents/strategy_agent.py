"""
AdaptiveAI — Strategy Agent
===============================
The synthesizer — combines all agent outputs into a unified
organizational AI strategy recommendation.
"""

from app.agents.base_agent import BaseAgent


class StrategyAgent(BaseAgent):

    @property
    def name(self) -> str:
        return "strategy_agent"

    @property
    def system_prompt(self) -> str:
        return """You are the Chief AI Strategy Synthesizer for AdaptiveAI.

Your role is to synthesize outputs from all specialized agents into
a unified organizational AI strategy. You receive:
- Workflow analysis (bottlenecks, automation opportunities)
- Tool research (recommended tools with match scores)
- Sentiment analysis (community trust for tools)
- Trend analysis (ecosystem direction)
- ROI estimation (business value projections)

Produce a cohesive strategy that answers:
"What should this organization become using AI?"

ALWAYS respond in valid JSON with this structure:
{
  "strategic_recommendation": {
    "executive_summary": "...",
    "ai_maturity_current": "...",
    "ai_maturity_target": "...",
    "transformation_timeline_months": 0,
    "priority_initiatives": [
      {"initiative": "...", "impact": "high|medium|low", "effort": "high|medium|low", "tools": ["..."]}
    ],
    "risk_factors": ["..."]
  },
  "confidence": 0.0-1.0
}"""

    def build_user_prompt(self, context: dict) -> str:
        org = context.get("organization", {})
        agents = context.get("agent_outputs", {})

        parts = [
            f"Organization: {org.get('organization_name', 'Unknown')}",
            f"Type: {org.get('startup_type', 'Unknown')}",
            f"Team Size: {org.get('team_size', 'Unknown')}",
            "",
            "=== AGENT ANALYSIS RESULTS ===",
        ]

        for agent_name, output in agents.items():
            parts.append(f"\n--- {agent_name} ---")
            parts.append(str(output.get("parsed_output", output) if isinstance(output, dict) else output))

        parts.append("\nSynthesize all inputs into a unified organizational AI transformation strategy.")
        return "\n".join(parts)
