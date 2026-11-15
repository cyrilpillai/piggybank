import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class AssetCategory(Base):
    __tablename__ = "asset_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(64), unique=True, nullable=False, index=True)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    sub_categories = relationship(
        "AssetSubCategory",
        back_populates="category",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="AssetSubCategory.display_order"
    )


class AssetSubCategory(Base):
    __tablename__ = "asset_sub_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_category_id = Column(String(36), ForeignKey("asset_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(64), nullable=False, index=True)
    is_liquid = Column(Boolean, default=True, nullable=False, index=True)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("asset_category_id", "name", name="uq_asset_category_sub_category"),
    )

    # Relationships
    category = relationship("AssetCategory", back_populates="sub_categories")
    assets = relationship("Asset", back_populates="sub_category_rel")
