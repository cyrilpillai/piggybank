from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.liability_category import LiabilityCategory
from app.schemas.liability_category import LiabilityCategoryResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/liability-categories", tags=["Liability Categories"])


@router.get("", response_model=List[LiabilityCategoryResponse])
async def list_liability_categories(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns supported liability categories loaded from database table.
    """
    result = await db.execute(
        select(LiabilityCategory).order_by(LiabilityCategory.display_order)
    )
    categories = result.scalars().all()
    return [LiabilityCategoryResponse.model_validate(c) for c in categories]
