import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Liability(Base):
    __tablename__ = "liabilities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False, index=True)  # e.g., Mortgage, Personal Loan, Credit Card, Student Loan, Auto Loan, Other
    liability_category_id = Column(String(36), ForeignKey("liability_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    amount = Column(Numeric(precision=18, scale=2), nullable=False)
    currency = Column(String(10), nullable=False, default="INR")
    interest_rate = Column(Float, nullable=True)  # e.g. 6.5 for 6.5%
    institution = Column(String(255), nullable=True)
    notes = Column(String(1000), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    user = relationship("User", back_populates="liabilities")
    liability_category_rel = relationship("LiabilityCategory", back_populates="liabilities", lazy="selectin")
