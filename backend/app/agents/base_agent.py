"""
AdaptiveAI — Base Agent
==========================
Abstract base class for all specialized reasoning agents.
Each agent is a structured reasoning module — NOT an autonomous AI entity.

DESIGN: Each agent receives context, performs specialized analysis
using AI (or mock), and returns structured output.
"""

from abc import ABC, abstractmethod
from typing import Any, Optional
from pydantic import BaseModel, Field

from app.core.ai_client import get_ai_client
from app.core.logging import get_logger


class AgentOutput(BaseModel):
    """Standardized output from any agent."""
    agent_name: str
    raw_output: str = ""
    parsed_output: dict = Field(default_factory=dict)
    confidence: float = 0.0
    error: Optional[str] = None


class BaseAgent(ABC):
    """
    Abstract base class for specialized reasoning agents.
    
    Each agent:
    1. Receives context (org data, market data, etc.)
    2. Constructs a specialized system prompt
    3. Generates analysis using AI
    4. Returns structured output
    """

    def __init__(self):
        self.ai_client = get_ai_client()
        self.logger = get_logger(f"agent.{self.name}")

    @property
    @abstractmethod
    def name(self) -> str:
        """Agent identifier."""
        ...

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """System prompt defining the agent's expertise and behavior."""
        ...

    @abstractmethod
    def build_user_prompt(self, context: dict) -> str:
        """Build the user prompt from the provided context."""
        ...

    async def analyze(self, context: dict) -> AgentOutput:
        """
        Execute the agent's analysis pipeline.
        1. Build prompt from context
        2. Call AI provider
        3. Parse and validate output
        """
        self.logger.info(f"{self.name} agent starting analysis")

        try:
            user_prompt = self.build_user_prompt(context)
            raw_response = await self.ai_client.generate(
                system_prompt=self.system_prompt,
                user_prompt=user_prompt,
                agent_name=self.name,
                response_format="json",
            )

            # Attempt to parse JSON response
            import json
            try:
                parsed = json.loads(raw_response)
            except json.JSONDecodeError:
                parsed = {"raw_text": raw_response}

            confidence = parsed.get("confidence", 0.8)

            output = AgentOutput(
                agent_name=self.name,
                raw_output=raw_response,
                parsed_output=parsed,
                confidence=confidence,
            )

            self.logger.info(f"{self.name} agent completed — confidence: {confidence}")
            return output

        except Exception as e:
            self.logger.error(f"{self.name} agent error: {e}")
            return AgentOutput(
                agent_name=self.name,
                error=str(e),
                confidence=0.0,
            )
