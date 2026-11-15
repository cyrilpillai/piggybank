from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.services.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.patch("/me", response_model=UserResponse)
async def update_user_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update the authenticated user's preferences, including default base currency.
    """
    if update_data.name is not None:
        current_user.name = update_data.name
    if update_data.dob is not None:
        current_user.dob = update_data.dob
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url
    if update_data.base_currency is not None:
        current_user.base_currency = update_data.base_currency.upper()

    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)
