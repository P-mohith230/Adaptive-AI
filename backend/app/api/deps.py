"""
AdaptiveAI — API Dependencies
================================
Shared dependency injection for route handlers.
"""

from fastapi import Depends, HTTPException, Header
from typing import Optional

from app.services.auth_service import AuthService
from app.schemas.user import UserResponse


async def get_current_user(authorization: Optional[str] = Header(None)) -> UserResponse:
    """Extract and validate the current user from the Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    # Support "Bearer <token>" format
    parts = authorization.split(" ")
    token = parts[1] if len(parts) == 2 else parts[0]

    try:
        auth_service = AuthService()
        return await auth_service.get_current_user(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[UserResponse]:
    """Optionally extract user — doesn't fail if not authenticated."""
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except Exception:
        return None
