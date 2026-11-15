import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False, index=True)  # e.g., Cash & Bank, Fixed Income, Equity, Commodities, Real Estate
    sub_category = Column(String(64), nullable=True, index=True)  # e.g., Savings, Fixed Deposit, Direct Equity Stocks, etc.
    sub_category_id = Column(String(36), ForeignKey("asset_sub_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    amount = Column(Numeric(precision=18, scale=2), nullable=False)
    currency = Column(String(10), nullable=False, default="INR")  # e.g. INR, USD, EUR
    institution = Column(String(255), nullable=True)  # e.g., Zerodha, Chase, Interactive Brokers, Fidelity
    notes = Column(String(1000), nullable=True)
    exclude_from_fire = Column(Boolean, default=False, nullable=False, index=True)
    
    # Ready for future AI & MCP agent syncing
    is_automated = Column(Boolean, default=False, nullable=False)
    external_source = Column(String(64), nullable=True)  # e.g. "zerodha", "ibkr"
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    user = relationship("User", back_populates="assets")
    sub_category_rel = relationship("AssetSubCategory", back_populates="assets", lazy="selectin")
