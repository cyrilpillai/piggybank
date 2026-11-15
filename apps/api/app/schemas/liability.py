import json
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

_LIABILITIES_FILE = Path(__file__).parent.parent / "data" / "liability_categories.json"


def get_liability_categories_data() -> List[Dict[str, Any]]:
    if _LIABILITIES_FILE.exists():
        with open(_LIABILITIES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return [{"name": "Home Loan", "display_order": 1}, {"name": "Other Liabilities", "display_order": 2}]


LIABILITY_CATEGORIES_DATA = get_liability_categories_data()
LIABILITY_CATEGORY_NAMES = [c["name"] for c in LIABILITY_CATEGORIES_DATA]


class LiabilityBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, examples=["Home Loan"])
    category: str = Field(default="Home Loan", examples=["Home Loan"])
    amount: Decimal = Field(..., ge=0, examples=[180000.00])
    currency: str = Field(default="INR", min_length=3, max_length=10, examples=["INR", "USD"])
    interest_rate: Optional[float] = Field(default=None, ge=0, le=100, examples=[6.5])
    institution: Optional[str] = Field(default=None, max_length=255, examples=["HDFC Bank", "Wells Fargo"])
    notes: Optional[str] = Field(default=None, max_length=1000)


class LiabilityCreate(LiabilityBase):
    pass


class LiabilityUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    category: Optional[str] = None
    amount: Optional[Decimal] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=10)
    interest_rate: Optional[float] = Field(default=None, ge=0, le=100)
    institution: Optional[str] = None
    notes: Optional[str] = None


class LiabilityResponse(LiabilityBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
