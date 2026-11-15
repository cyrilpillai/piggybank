import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class LiabilityCategory(Base):
    __tablename__ = "liability_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(64), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    liabilities = relationship("Liability", back_populates="liability_category_rel")
