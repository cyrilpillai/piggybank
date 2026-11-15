from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict


class AssetSubCategoryResponse(BaseModel):
    id: str
    asset_category_id: str
    name: str
    is_liquid: bool
    display_order: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssetCategoryResponse(BaseModel):
    id: str
    name: str
    display_order: int
    created_at: datetime
    sub_categories: List[AssetSubCategoryResponse] = []

    model_config = ConfigDict(from_attributes=True)
