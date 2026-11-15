from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.asset_category import AssetCategory
from app.schemas.asset_category import AssetCategoryResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/asset-categories", tags=["Asset Categories"])


@router.get("", response_model=List[AssetCategoryResponse])
async def list_asset_categories(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns supported asset categories and their associated sub-categories along with liquidity flags.
    """
    result = await db.execute(
        select(AssetCategory)
        .options(selectinload(AssetCategory.sub_categories))
        .order_by(AssetCategory.display_order)
    )
    categories = result.scalars().all()
    return [AssetCategoryResponse.model_validate(c) for c in categories]
