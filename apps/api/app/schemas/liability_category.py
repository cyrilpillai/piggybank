from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class LiabilityCategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    display_order: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
