import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Date
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    dob = Column(Date, nullable=True)
    avatar_url = Column(String(1024), nullable=True)
    google_sub = Column(String(255), unique=True, index=True, nullable=True)
    base_currency = Column(String(10), default="INR", nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    assets = relationship("Asset", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    liabilities = relationship("Liability", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    fire_scenarios = relationship("FireScenario", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    net_worth_snapshots = relationship("NetWorthSnapshot", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
