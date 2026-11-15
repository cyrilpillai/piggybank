from typing import List, Dict
from fastapi import APIRouter, Depends
from app.models.user import User
from app.services.auth import get_current_user
from app.services.fx import fx_service

router = APIRouter(prefix="/currencies", tags=["Currencies"])


@router.get("/supported", response_model=List[Dict[str, str]])
async def get_supported_currencies(current_user: User = Depends(get_current_user)):
    """
    Returns supported currencies with code, name, and symbol for the authenticated user.
    """
    return fx_service.get_supported_currencies()


@router.get("/rates")
async def get_rates(base: str = "INR", current_user: User = Depends(get_current_user)):
    """
    Returns current exchange rates against the given base currency for the authenticated user.
    """
    rates = await fx_service.get_rates_for_base(base.upper())
    return {"base": base.upper(), "rates": rates}
