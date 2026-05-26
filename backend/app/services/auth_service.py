"""
AdaptiveAI — Authentication Service
======================================
JWT-based authentication with password hashing.
Designed to be swappable with Clerk or other providers.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from app.config import get_settings
from app.storage.sheet_manager import get_sheet_manager
from app.schemas.user import UserCreate, UserInDB, UserResponse, TokenResponse
from app.core.exceptions import (
    InvalidCredentialsError,
    TokenExpiredError,
    DuplicateRecordError,
    AuthenticationError,
)
from app.core.logging import get_logger

logger = get_logger("auth_service")

# Password hashing using native bcrypt for reliability on Python 3.13+


class AuthService:
    """Handles user authentication, registration, and token management."""

    def __init__(self):
        self.settings = get_settings()
        self.sheets = get_sheet_manager()

    def _hash_password(self, password: str) -> str:
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')

    def _verify_password(self, plain: str, hashed: str) -> bool:
        if not plain or not hashed:
            return False
        try:
            plain_bytes = plain.encode('utf-8')
            hashed_bytes = hashed.encode('utf-8')
            return bcrypt.checkpw(plain_bytes, hashed_bytes)
        except Exception as e:
            logger.error(f"Password verification failed: {e}")
            return False

    def _create_token(self, user_id: str, email: str) -> str:
        """Create a JWT access token."""
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=self.settings.JWT_EXPIRATION_MINUTES
        )
        payload = {
            "sub": user_id,
            "email": email,
            "exp": expire,
            "iat": datetime.now(timezone.utc),
        }
        return jwt.encode(
            payload,
            self.settings.JWT_SECRET_KEY,
            algorithm=self.settings.JWT_ALGORITHM,
        )

    def verify_token(self, token: str) -> dict:
        """Verify and decode a JWT token."""
        try:
            payload = jwt.decode(
                token,
                self.settings.JWT_SECRET_KEY,
                algorithms=[self.settings.JWT_ALGORITHM],
            )
            return payload
        except JWTError as e:
            raise TokenExpiredError(f"Invalid or expired token: {e}")

    async def register(self, user_data: UserCreate) -> TokenResponse:
        """Register a new user."""
        # Check if email already exists (exact match)
        existing = await self.sheets.users.find_by_field("email", user_data.email)
        if existing:
            raise DuplicateRecordError("A user with this email already exists")

        # Create user record
        user = UserInDB(
            name=user_data.name,
            email=user_data.email,
            role=user_data.role,
            organization_id=user_data.organization_id or "",
            hashed_password=self._hash_password(user_data.password),
        )

        await self.sheets.users.insert(user.model_dump())
        logger.info(f"Registered new user: {user.email}")

        # Generate token
        token = self._create_token(user.user_id, user.email)
        user_response = UserResponse(
            user_id=user.user_id,
            name=user.name,
            email=user.email,
            role=user.role,
            organization_id=user.organization_id or None,
            created_at=user.created_at,
        )

        return TokenResponse(access_token=token, user=user_response)

    async def login(self, email: str, password: str) -> TokenResponse:
        """Authenticate a user and return a token."""
        users = await self.sheets.users.find_by_field("email", email)

        if not users:
            raise InvalidCredentialsError()

        user_data = users[0]

        if not self._verify_password(password, user_data.get("hashed_password", "")):
            raise InvalidCredentialsError()

        token = self._create_token(user_data["user_id"], user_data["email"])

        user_response = UserResponse(
            user_id=user_data["user_id"],
            name=user_data["name"],
            email=user_data["email"],
            role=user_data.get("role", "member"),
            organization_id=user_data.get("organization_id") or None,
            created_at=user_data.get("created_at", datetime.utcnow()),
        )

        return TokenResponse(access_token=token, user=user_response)

    async def get_current_user(self, token: str) -> UserResponse:
        """Get the current user from a token."""
        payload = self.verify_token(token)
        user_id = payload.get("sub")

        if not user_id:
            raise AuthenticationError("Invalid token payload")

        user_data = await self.sheets.users.find_by_id(user_id)
        if not user_data:
            raise AuthenticationError("User not found")

        return UserResponse(
            user_id=user_data["user_id"],
            name=user_data["name"],
            email=user_data["email"],
            role=user_data.get("role", "member"),
            organization_id=user_data.get("organization_id") or None,
            created_at=user_data.get("created_at", datetime.utcnow()),
        )

    async def update_user_organization(self, user_id: str, organization_id: str) -> bool:
        """Link a user to an organization."""
        return await self.sheets.users.update(user_id, {"organization_id": organization_id})
