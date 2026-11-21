from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.asset import Asset
from app.models.asset_category import AssetSubCategory, AssetCategory
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse, ASSET_SUB_CATEGORIES
from app.services.auth import get_current_user
from app.services.dashboard import upsert_today_snapshot

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.get("/categories", response_model=Dict[str, List[str]])
async def get_asset_categories(current_user: User = Depends(get_current_user)):
    """
    Returns supported asset categories and their associated sub-categories for authenticated users.
    """
    return ASSET_SUB_CATEGORIES


@router.get("", response_model=List[AssetResponse])
async def list_assets(
    category: Optional[str] = Query(None, description="Filter by asset category"),
    sub_category: Optional[str] = Query(None, description="Filter by asset sub-category"),
    exclude_from_fire: Optional[bool] = Query(None, description="Filter by FIRE exclusion status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Asset).where(Asset.user_id == current_user.id)
    if category:
        query = query.where(Asset.category == category)
    if sub_category:
        query = query.where(Asset.sub_category == sub_category)
    if exclude_from_fire is not None:
        query = query.where(Asset.exclude_from_fire == exclude_from_fire)
    query = query.order_by(Asset.updated_at.desc())

    result = await db.execute(query)
    assets = result.scalars().all()
    return [AssetResponse.model_validate(a) for a in assets]


@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset_in: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    sub_category_id = asset_in.sub_category_id
    is_liquid = True
    if not sub_category_id and asset_in.sub_category:
        sc_res = await db.execute(
            select(AssetSubCategory).where(AssetSubCategory.name == asset_in.sub_category)
        )
        sc = sc_res.scalars().first()
        if sc:
            sub_category_id = sc.id
            is_liquid = sc.is_liquid
    elif sub_category_id:
        sc_res = await db.execute(
            select(AssetSubCategory).where(AssetSubCategory.id == sub_category_id)
        )
        sc = sc_res.scalars().first()
        if sc:
            is_liquid = sc.is_liquid

    # An asset is excluded from FIRE if explicitly marked, or if inherently illiquid (Car, Real estate, etc.)
    exclude_from_fire = asset_in.exclude_from_fire or (not is_liquid)

    asset = Asset(
        user_id=current_user.id,
        name=asset_in.name,
        category=asset_in.category,
        sub_category=asset_in.sub_category,
        sub_category_id=sub_category_id,
        amount=asset_in.amount,
        currency=asset_in.currency.upper(),
        institution=asset_in.institution,
        notes=asset_in.notes,
        exclude_from_fire=exclude_from_fire
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    await upsert_today_snapshot(user=current_user, db=db)
    return AssetResponse.model_validate(asset)


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where((Asset.id == asset_id) & (Asset.user_id == current_user.id))
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return AssetResponse.model_validate(asset)


@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: str,
    asset_in: AssetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where((Asset.id == asset_id) & (Asset.user_id == current_user.id))
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if asset_in.name is not None:
        asset.name = asset_in.name
    if asset_in.category is not None:
        asset.category = asset_in.category
    if asset_in.sub_category_id is not None:
        asset.sub_category_id = asset_in.sub_category_id
    elif asset_in.sub_category is not None:
        asset.sub_category = asset_in.sub_category
        sc_res = await db.execute(
            select(AssetSubCategory).where(AssetSubCategory.name == asset_in.sub_category)
        )
        sc = sc_res.scalars().first()
        if sc:
            asset.sub_category_id = sc.id
    if asset_in.amount is not None:
        asset.amount = asset_in.amount
    if asset_in.currency is not None:
        asset.currency = asset_in.currency.upper()
    if asset_in.institution is not None:
        asset.institution = asset_in.institution
    if asset_in.notes is not None:
        asset.notes = asset_in.notes
    if asset_in.exclude_from_fire is not None:
        asset.exclude_from_fire = asset_in.exclude_from_fire

    # Ensure illiquid assets are always excluded from FIRE
    if asset.sub_category_id:
        sc_res = await db.execute(select(AssetSubCategory).where(AssetSubCategory.id == asset.sub_category_id))
        sc = sc_res.scalars().first()
        if sc and not sc.is_liquid:
            asset.exclude_from_fire = True

    await db.commit()
    await db.refresh(asset)
    await upsert_today_snapshot(user=current_user, db=db)
    return AssetResponse.model_validate(asset)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where((Asset.id == asset_id) & (Asset.user_id == current_user.id))
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    await db.delete(asset)
    await db.commit()
    await upsert_today_snapshot(user=current_user, db=db)
    return None
