from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.schemas.auth import GoogleAuthRequest, DevLoginRequest, RefreshTokenRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services.auth import (
    verify_google_credential,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    get_current_user,
)
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/google", response_model=TokenResponse)
async def login_with_google(request: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate via Google OAuth ID token from Google Sign-In button.
    Finds existing user by google_sub or email, or registers a new user.
    """
    google_data = await verify_google_credential(request.credential)
    email = google_data["email"]
    google_sub = google_data["sub"]
    name = google_data["name"]
    avatar_url = google_data.get("avatar_url")

    # Check if user already exists by google_sub or email
    result = await db.execute(
        select(User).where((User.google_sub == google_sub) | (User.email == email))
    )
    user = result.scalar_one_or_none()

    if user:
        # Update user profile information if changed
        user.name = name
        user.avatar_url = avatar_url
        if not user.google_sub:
            user.google_sub = google_sub
    else:
        # Create brand-new user
        user = User(
            email=email,
            name=name,
            google_sub=google_sub,
            avatar_url=avatar_url,
            base_currency=settings.DEFAULT_BASE_CURRENCY
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)

    access_token = create_access_token({"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token({"sub": user.id})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/dev-login", response_model=TokenResponse)
async def dev_login(request: DevLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Developer login bypass for fast local testing without needing Google Cloud credentials.
    Only available in development environments.
    """
    if settings.ENVIRONMENT.lower() not in ("development", "dev", "local", "test"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Developer login is only available in development environment."
        )

    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=request.email,
            name=request.name,
            avatar_url=request.avatar_url,
            base_currency=settings.DEFAULT_BASE_CURRENCY
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token({"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token({"sub": user.id})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(request: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """
    Exchanges a valid refresh token for a fresh access_token and refresh_token pair.
    """
    user_id = verify_refresh_token(request.refresh_token)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    new_access_token = create_access_token({"sub": user.id, "email": user.email})
    new_refresh_token = create_refresh_token({"sub": user.id})
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Revokes the current session for the authenticated user.
    """
    return {
        "status": "success",
        "message": f"Successfully signed out {current_user.name} from Piggybank",
    }


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Returns the currently authenticated user's profile and default base currency.
    """
    return UserResponse.model_validate(current_user)
