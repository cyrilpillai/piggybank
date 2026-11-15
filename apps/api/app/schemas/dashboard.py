from decimal import Decimal
from typing import List
from pydantic import BaseModel


class SubCategoryBreakdown(BaseModel):
    sub_category: str
    total_amount: Decimal
    percentage: float
    count: int


class CategoryBreakdown(BaseModel):
    category: str
    total_amount: Decimal
    percentage: float
    count: int
    sub_categories: List[SubCategoryBreakdown] = []


class NetWorthSummary(BaseModel):
    base_currency: str
    total_assets: Decimal
    total_liabilities: Decimal
    net_worth: Decimal
    debt_to_asset_ratio: float
    asset_count: int
    liability_count: int


class DashboardResponse(BaseModel):
    summary: NetWorthSummary
    asset_categories: List[CategoryBreakdown]
    liability_categories: List[CategoryBreakdown]
