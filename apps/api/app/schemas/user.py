from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    email: str
    name: str
    dob: Optional[date] = None
    avatar_url: Optional[str] = None
    base_currency: str = Field(default="INR", max_length=10)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    dob: Optional[date] = None
    avatar_url: Optional[str] = None
    base_currency: Optional[str] = Field(default=None, max_length=10)


class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
