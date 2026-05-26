"""
AdaptiveAI — Centralized Configuration
=======================================
All settings are loaded from environment variables or .env file.
Never hardcode paths or credentials — everything is configurable.

STORAGE_BACKEND flag enables zero-code migration from XLS → PostgreSQL.
"""

from pathlib import Path
from typing import Literal
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "AdaptiveAI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"

    # ── Server ───────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "https://frontend-production-b552.up.railway.app"]

    # ── Storage ──────────────────────────────────────────
    # Switch this to "sql" for PostgreSQL or "google_sheets" for live cloud database
    STORAGE_BACKEND: Literal["xls", "sql", "google_sheets"] = "xls"
    DATA_DIR: Path = Path(__file__).parent.parent / "data"

    # ── Google Sheets Configuration ──────────────────────
    GOOGLE_SHEETS_SPREADSHEET_ID: str = ""
    GOOGLE_SERVICE_ACCOUNT_EMAIL: str = ""
    GOOGLE_PRIVATE_KEY: str = ""

    # ── Database (future PostgreSQL migration) ───────────
    DATABASE_URL: str = ""
    
    # ── Authentication ───────────────────────────────────
    JWT_SECRET_KEY: str = "adaptiveai-dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours

    # ── AI Providers (Groq + OpenRouter) ─────────────────
    GROQ_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""

    # ── AI Model Configuration ───────────────────────────
    DEFAULT_AI_MODEL: str = "llama-3.3-70b-versatile"
    AI_TEMPERATURE: float = 0.7
    AI_MAX_TOKENS: int = 4096

    # ── Market Intelligence APIs ─────────────────────────
    REDDIT_CLIENT_ID: str = ""
    REDDIT_CLIENT_SECRET: str = ""
    GITHUB_TOKEN: str = ""
    PRODUCTHUNT_TOKEN: str = ""
    NEWS_API_KEY: str = ""

    # ── Feature Flags ────────────────────────────────────
    ENABLE_LIVE_MARKET_INTELLIGENCE: bool = True
    ENABLE_AI_AGENTS: bool = True
    USE_MOCK_AI: bool = False  # Set True only for development without API keys
    SEED_ON_STARTUP: bool = False  # Set True to seed demo data on startup

    @property
    def data_dir(self) -> Path:
        """Ensure data directory exists and return path."""
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)
        return self.DATA_DIR

    @property
    def is_ai_available(self) -> bool:
        """Check if any AI API key is configured."""
        return bool(self.GROQ_API_KEY or self.OPENROUTER_API_KEY)

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
