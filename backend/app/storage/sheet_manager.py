"""
AdaptiveAI — Sheet Manager
=============================
Manages the lifecycle of all 8 master XLS sheets.
- Initializes sheets with correct schemas on first run
- Provides repository instances for each sheet
- Health checking and data integrity validation

This is the SINGLE ENTRY POINT for all storage access.
Services never create repositories directly.
"""

from pathlib import Path
from app.storage.base_repository import BaseRepository
from app.storage.xls_repository import XLSRepository
from app.storage.google_sheets_repository import GoogleSheetsRepository
from app.config import get_settings
from app.core.logging import get_logger

logger = get_logger("sheet_manager")


# ── Sheet Schema Definitions ────────────────────────────
# Each sheet's columns match the master architecture document (Doc 05)

SHEET_SCHEMAS = {
    "USERS_MASTER": {
        "id_field": "user_id",
        "columns": [
            "user_id", "name", "email", "role",
            "organization_id", "hashed_password", "created_at",
        ],
    },
    "ORGANIZATIONS_MASTER": {
        "id_field": "organization_id",
        "columns": [
            "organization_id", "organization_name", "startup_type",
            "team_size", "ai_maturity_score", "workflows", "pain_points",
            "current_ai_tools", "automation_goals", "monthly_manual_hours",
            "employee_hourly_rate", "annual_ai_budget", "created_at",
        ],
    },
    "AI_TOOLS_MASTER": {
        "id_field": "tool_id",
        "columns": [
            "tool_id", "tool_name", "category", "pricing",
            "trust_score", "future_proof_score", "github_growth",
            "reddit_sentiment", "market_velocity", "compatibility_tags",
            "api_support", "security_score", "description", "website", "created_at",
        ],
    },
    "RECOMMENDATIONS_MASTER": {
        "id_field": "recommendation_id",
        "columns": [
            "recommendation_id", "organization_id", "recommended_tools",
            "reasoning_summary", "workflow_alignment", "compatibility_score",
            "roi_estimation", "future_growth_prediction", "created_at",
        ],
    },
    "ALERTS_MASTER": {
        "id_field": "alert_id",
        "columns": [
            "alert_id", "organization_id", "alert_type", "alert_message",
            "replacement_tool", "severity", "market_change_trigger",
            "is_dismissed", "created_at",
        ],
    },
    "MARKET_INTELLIGENCE_MASTER": {
        "id_field": "intelligence_id",
        "columns": [
            "intelligence_id", "source_type", "source_name", "tool_name",
            "sentiment_score", "trend_velocity", "community_mentions",
            "github_growth", "producthunt_rank", "funding_activity", "created_at",
        ],
    },
    "AGENT_REASONING_MASTER": {
        "id_field": "reasoning_id",
        "columns": [
            "reasoning_id", "organization_id", "query",
            "workflow_agent_output", "research_agent_output",
            "sentiment_agent_output", "trend_agent_output",
            "roi_agent_output", "strategy_agent_output",
            "final_synthesis", "created_at",
        ],
    },
    "DIGITAL_TWIN_MASTER": {
        "id_field": "twin_id",
        "columns": [
            "twin_id", "organization_id", "workflow_map",
            "operational_structure", "bottlenecks",
            "ai_adoption_state", "optimization_predictions", "created_at",
        ],
    },
}


class SheetManager:
    """
    Central manager for all XLS repositories.
    Provides typed access to each master sheet.
    """

    def __init__(self):
        settings = get_settings()
        self._data_dir = settings.data_dir
        self._repositories: dict[str, BaseRepository] = {}

        # Initialize all repositories
        self._init_repositories()

    def _init_repositories(self):
        """Create repository instances for all master sheets."""
        settings = get_settings()
        backend_type = settings.STORAGE_BACKEND
        
        for sheet_name, schema in SHEET_SCHEMAS.items():
            if backend_type == "google_sheets":
                self._repositories[sheet_name] = GoogleSheetsRepository(
                    sheet_name=sheet_name,
                    id_field=schema["id_field"],
                    columns=schema["columns"],
                )
            else:
                self._repositories[sheet_name] = XLSRepository(
                    sheet_name=sheet_name,
                    id_field=schema["id_field"],
                    columns=schema["columns"],
                    data_dir=self._data_dir,
                )
        logger.info(f"Initialized {len(self._repositories)} master {backend_type} repositories")

    # ── Typed Repository Accessors ───────────────────────

    @property
    def users(self) -> BaseRepository:
        return self._repositories["USERS_MASTER"]

    @property
    def organizations(self) -> BaseRepository:
        return self._repositories["ORGANIZATIONS_MASTER"]

    @property
    def ai_tools(self) -> BaseRepository:
        return self._repositories["AI_TOOLS_MASTER"]

    @property
    def recommendations(self) -> BaseRepository:
        return self._repositories["RECOMMENDATIONS_MASTER"]

    @property
    def alerts(self) -> BaseRepository:
        return self._repositories["ALERTS_MASTER"]

    @property
    def market_intelligence(self) -> BaseRepository:
        return self._repositories["MARKET_INTELLIGENCE_MASTER"]

    @property
    def agent_reasoning(self) -> BaseRepository:
        return self._repositories["AGENT_REASONING_MASTER"]

    @property
    def digital_twins(self) -> BaseRepository:
        return self._repositories["DIGITAL_TWIN_MASTER"]

    # ── Health Check ─────────────────────────────────────

    async def health_check(self) -> dict:
        """Check integrity of all master sheets."""
        report = {}
        for name, repo in self._repositories.items():
            try:
                count = await repo.count()
                report[name] = {"status": "healthy", "record_count": count}
            except Exception as e:
                report[name] = {"status": "error", "error": str(e)}
        return report


# ── Singleton ────────────────────────────────────────────

_sheet_manager: SheetManager | None = None


def get_sheet_manager() -> SheetManager:
    """Get or create the SheetManager singleton."""
    global _sheet_manager
    if _sheet_manager is None:
        _sheet_manager = SheetManager()
    return _sheet_manager
