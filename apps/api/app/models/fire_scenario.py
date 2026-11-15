import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class FireScenario(Base):
    __tablename__ = "fire_scenarios"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    is_default = Column(Boolean, default=False, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)

    monthly_expenses_retirement = Column(Numeric(precision=18, scale=2), nullable=False)
    retirement_age_goal = Column(Numeric(precision=5, scale=2), nullable=False)
    monthly_contribution = Column(Numeric(precision=18, scale=2), nullable=False)
    tax_rate_retirement = Column(Numeric(precision=6, scale=4), nullable=False)  # e.g. 0.1500 for 15%
    swr = Column(Numeric(precision=6, scale=4), nullable=False, default=0.0400)   # e.g. 0.0400 for 4%
    expected_annual_return = Column(Numeric(precision=6, scale=4), nullable=False) # e.g. 0.1000 for 10%
    inflation = Column(Numeric(precision=6, scale=4), nullable=False)            # e.g. 0.0600 for 6%
    contribution_growth_rate = Column(Numeric(precision=6, scale=4), default=0.0000, nullable=False) # e.g. 0.0500 for 5%

    custom_liquid_override = Column(Numeric(precision=18, scale=2), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    user = relationship("User", back_populates="fire_scenarios")
