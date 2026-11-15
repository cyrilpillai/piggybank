from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.liability import Liability
from app.models.liability_category import LiabilityCategory
from app.schemas.liability import LiabilityCreate, LiabilityUpdate, LiabilityResponse
from app.schemas.liability_category import LiabilityCategoryResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/liabilities", tags=["Liabilities"])


@router.get("/categories", response_model=List[LiabilityCategoryResponse])
async def get_liability_categories(
    current_user: User = Depends(get_current_user),
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


@router.get("", response_model=List[LiabilityResponse])
async def list_liabilities(
    category: Optional[str] = Query(None, description="Filter by liability category"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Liability).where(Liability.user_id == current_user.id)
    if category:
        query = query.where(Liability.category == category)
    query = query.order_by(Liability.updated_at.desc())

    result = await db.execute(query)
    liabilities = result.scalars().all()
    return [LiabilityResponse.model_validate(l) for l in liabilities]


@router.post("", response_model=LiabilityResponse, status_code=status.HTTP_201_CREATED)
async def create_liability(
    liability_in: LiabilityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    liability_cat_id = None
    if liability_in.category:
        lc_res = await db.execute(
            select(LiabilityCategory).where(LiabilityCategory.name == liability_in.category)
        )
        lc = lc_res.scalars().first()
        if lc:
            liability_cat_id = lc.id

    liability = Liability(
        user_id=current_user.id,
        name=liability_in.name,
        category=liability_in.category,
        liability_category_id=liability_cat_id,
        amount=liability_in.amount,
        currency=liability_in.currency.upper(),
        interest_rate=liability_in.interest_rate,
        institution=liability_in.institution,
        notes=liability_in.notes
    )
    db.add(liability)
    await db.commit()
    await db.refresh(liability)
    return LiabilityResponse.model_validate(liability)


@router.get("/{liability_id}", response_model=LiabilityResponse)
async def get_liability(
    liability_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Liability).where((Liability.id == liability_id) & (Liability.user_id == current_user.id))
    )
    liability = result.scalar_one_or_none()
    if not liability:
        raise HTTPException(status_code=404, detail="Liability not found")
    return LiabilityResponse.model_validate(liability)


@router.put("/{liability_id}", response_model=LiabilityResponse)
async def update_liability(
    liability_id: str,
    liability_in: LiabilityUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Liability).where((Liability.id == liability_id) & (Liability.user_id == current_user.id))
    )
    liability = result.scalar_one_or_none()
    if not liability:
        raise HTTPException(status_code=404, detail="Liability not found")

    if liability_in.name is not None:
        liability.name = liability_in.name
    if liability_in.category is not None:
        liability.category = liability_in.category
    if liability_in.amount is not None:
        liability.amount = liability_in.amount
    if liability_in.currency is not None:
        liability.currency = liability_in.currency.upper()
    if liability_in.interest_rate is not None:
        liability.interest_rate = liability_in.interest_rate
    if liability_in.institution is not None:
        liability.institution = liability_in.institution
    if liability_in.notes is not None:
        liability.notes = liability_in.notes

    await db.commit()
    await db.refresh(liability)
    return LiabilityResponse.model_validate(liability)


@router.delete("/{liability_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_liability(
    liability_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Liability).where((Liability.id == liability_id) & (Liability.user_id == current_user.id))
    )
    liability = result.scalar_one_or_none()
    if not liability:
        raise HTTPException(status_code=404, detail="Liability not found")

    await db.delete(liability)
    await db.commit()
    return None
