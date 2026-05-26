"""
AdaptiveAI — Auth Routes
===========================
"""

from fastapi import APIRouter, HTTPException
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse
from app.api.deps import get_current_user
from fastapi import Depends

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse)
async def signup(data: UserCreate):
    """Register a new user."""
    try:
        service = AuthService()
        return await service.register(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    """Authenticate a user."""
    try:
        service = AuthService()
        return await service.login(data.email, data.password)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_me(user: UserResponse = Depends(get_current_user)):
    """Get current user profile."""
    return user
