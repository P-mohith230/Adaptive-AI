"""
AdaptiveAI — Custom Exception Hierarchy
========================================
Structured exceptions for clean error handling across all layers.
Each exception maps to an HTTP status code for the API layer.
"""


class AdaptiveAIError(Exception):
    """Base exception for all AdaptiveAI errors."""
    status_code: int = 500
    detail: str = "An internal error occurred"

    def __init__(self, detail: str | None = None):
        self.detail = detail or self.__class__.detail
        super().__init__(self.detail)


# ── Storage Errors ───────────────────────────────────────

class StorageError(AdaptiveAIError):
    """Base storage layer error."""
    status_code = 500
    detail = "Storage operation failed"


class RecordNotFoundError(StorageError):
    """Requested record does not exist."""
    status_code = 404
    detail = "Record not found"


class DuplicateRecordError(StorageError):
    """Record with this ID already exists."""
    status_code = 409
    detail = "Record already exists"


class SheetCorruptionError(StorageError):
    """XLS sheet schema is invalid or corrupted."""
    status_code = 500
    detail = "Data sheet corruption detected"


# ── Authentication Errors ────────────────────────────────

class AuthenticationError(AdaptiveAIError):
    """Authentication failed."""
    status_code = 401
    detail = "Authentication failed"


class InvalidCredentialsError(AuthenticationError):
    """Wrong email or password."""
    detail = "Invalid email or password"


class TokenExpiredError(AuthenticationError):
    """JWT token has expired."""
    detail = "Authentication token has expired"


# ── Authorization Errors ─────────────────────────────────

class AuthorizationError(AdaptiveAIError):
    """User lacks required permissions."""
    status_code = 403
    detail = "Insufficient permissions"


# ── Validation Errors ────────────────────────────────────

class ValidationError(AdaptiveAIError):
    """Input data validation failed."""
    status_code = 422
    detail = "Validation error"


class OrganizationNotFoundError(AdaptiveAIError):
    """Organization does not exist."""
    status_code = 404
    detail = "Organization not found"


# ── Agent Errors ─────────────────────────────────────────

class AgentError(AdaptiveAIError):
    """Multi-agent system error."""
    status_code = 500
    detail = "Agent processing error"


class AgentTimeoutError(AgentError):
    """Agent took too long to respond."""
    detail = "Agent reasoning timed out"


class AIProviderError(AgentError):
    """Upstream AI provider (OpenAI, etc.) failed."""
    detail = "AI provider unavailable"


# ── Intelligence Errors ──────────────────────────────────

class MarketIntelligenceError(AdaptiveAIError):
    """Market intelligence pipeline error."""
    status_code = 500
    detail = "Market intelligence processing failed"
