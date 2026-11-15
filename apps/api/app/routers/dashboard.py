from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardResponse
from app.services.auth import get_current_user
from app.services.dashboard import calculate_dashboard

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardResponse)
async def get_dashboard_summary(
    currency: Optional[str] = Query(None, description="Target base currency for calculation (e.g. INR, USD)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get aggregated net worth, asset/liability totals and category breakdowns.
    If 'currency' is not specified, uses the user's default base currency preference.
    """
    target_currency = currency if currency else current_user.base_currency
    return await calculate_dashboard(user=current_user, db=db, target_currency=target_currency)
