from typing import Optional
from pydantic import BaseModel
from app.schemas.user import UserResponse


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token (JWT) from Google Sign-In button


class DevLoginRequest(BaseModel):
    email: str = "john.doe@example.com"
    name: str = "John Doe"
    avatar_url: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: str  # User ID
    email: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = "access"
