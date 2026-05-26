"""
AdaptiveAI — User Schema
==========================
Maps to USERS_MASTER.xlsx
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr
import uuid


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)
    role: str = Field(default="member", description="User role: admin, member, viewer")
    organization_id: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: str
    password: str


class UserInDB(UserBase):
    user_id: str = Field(default_factory=lambda: f"usr_{uuid.uuid4().hex[:12]}")
    hashed_password: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    organization_id: Optional[str] = None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
