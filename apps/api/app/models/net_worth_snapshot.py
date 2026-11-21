import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Numeric, DateTime, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class NetWorthSnapshot(Base):
    __tablename__ = "net_worth_snapshots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    total_assets = Column(Numeric(precision=18, scale=2), nullable=False, default=0)
    total_liabilities = Column(Numeric(precision=18, scale=2), nullable=False, default=0)
    net_worth = Column(Numeric(precision=18, scale=2), nullable=False, default=0)
    currency = Column(String(10), nullable=False, default="INR")

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint("user_id", "snapshot_date", name="uq_user_snapshot_date"),
    )

    user = relationship("User", back_populates="net_worth_snapshots")
