"""
AdaptiveAI — Logging Configuration
====================================
Structured logging with JSON format for production
and human-readable format for development.
"""

import logging
import sys
from app.config import get_settings


def setup_logging() -> logging.Logger:
    """Configure application-wide logging."""
    settings = get_settings()

    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    # Create the root logger for the app
    logger = logging.getLogger("adaptiveai")
    logger.setLevel(log_level)

    # Prevent duplicate handlers
    if logger.handlers:
        return logger

    # Console handler with formatting
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)

    if settings.ENVIRONMENT == "production":
        # JSON-style structured logging for production
        formatter = logging.Formatter(
            '{"timestamp":"%(asctime)s","level":"%(levelname)s",'
            '"module":"%(module)s","message":"%(message)s"}'
        )
    else:
        # Human-readable for development
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)-20s | %(message)s",
            datefmt="%H:%M:%S",
        )

    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    return logger


def get_logger(name: str) -> logging.Logger:
    """Get a child logger for a specific module."""
    return logging.getLogger(f"adaptiveai.{name}")
