from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AssetCategory(str, Enum):
    CASH_AND_BANK = "Cash & Bank"
    FIXED_INCOME = "Fixed Income"
    EQUITY = "Equity"
    COMMODITIES = "Commodities"
    REAL_ESTATE = "Real Estate"


ASSET_SUB_CATEGORIES: Dict[str, List[str]] = {
    AssetCategory.CASH_AND_BANK.value: [
        "Savings",
        "Current",
    ],
    AssetCategory.FIXED_INCOME.value: [
        "Fixed Deposit",
        "PPF",
        "EPF",
        "Debt Mutual Fund",
        "Debt ETFs",
    ],
    AssetCategory.EQUITY.value: [
        "Direct Equity Stocks",
        "Equity Mutual Fund",
        "Equity ETFs",
    ],
    AssetCategory.COMMODITIES.value: [
        "Physical Gold",
        "Digital Gold",
        "Gold ETF",
        "Car",
    ],
    AssetCategory.REAL_ESTATE.value: [
        "Residential",
        "Commercial",
        "REIT",
    ],
}


class AssetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, examples=["Zerodha Demat Portfolio"])
    category: str = Field(default=AssetCategory.EQUITY.value, examples=["Equity"])
    sub_category: Optional[str] = Field(default=None, max_length=64, examples=["Direct Equity Stocks"])
    sub_category_id: Optional[str] = Field(default=None, examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"])
    amount: Decimal = Field(..., ge=0, examples=[25000.50])
    currency: str = Field(default="INR", min_length=3, max_length=10, examples=["INR", "USD"])
    institution: Optional[str] = Field(default=None, max_length=255, examples=["Zerodha", "Chase", "IBKR"])
    notes: Optional[str] = Field(default=None, max_length=1000)
    exclude_from_fire: bool = Field(default=False, description="Exclude asset from FIRE calculation corpus (e.g. for Emergency Fund)")


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    category: Optional[str] = None
    sub_category: Optional[str] = None
    sub_category_id: Optional[str] = None
    amount: Optional[Decimal] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=10)
    institution: Optional[str] = None
    notes: Optional[str] = None
    exclude_from_fire: Optional[bool] = None


class AssetResponse(AssetBase):
    id: str
    user_id: str
    is_automated: bool
    external_source: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
