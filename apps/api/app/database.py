from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

# Configure connection arguments depending on dialect
connect_args = {}
if "sqlite" in settings.async_database_url:
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args=connect_args
)

async_session = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables and seed baseline categories if empty."""
    # Ensure all models are registered on Base.metadata
    from datetime import datetime, timezone
    from pathlib import Path
    import json
    import uuid
    import app.models.user
    import app.models.asset
    import app.models.liability
    import app.models.asset_category
    import app.models.liability_category
    import app.models.fire_scenario
    import app.models.net_worth_snapshot

    asset_seed_path = Path(__file__).parent / "data" / "asset_categories.json"
    liability_seed_path = Path(__file__).parent / "data" / "liability_categories.json"

    def _sync_init(sync_conn):
        from sqlalchemy import text
        Base.metadata.create_all(sync_conn)

        now_utc = datetime.now(timezone.utc)

        # 1. Seed asset categories & subcategories from JSON file if empty
        asset_cat_count = sync_conn.execute(text("SELECT COUNT(*) FROM asset_categories")).scalar()
        if not asset_cat_count and asset_seed_path.exists():
            with open(asset_seed_path, "r", encoding="utf-8") as f:
                asset_categories_data = json.load(f)

            for cat_dict in asset_categories_data:
                cat_id = str(uuid.uuid4())
                sync_conn.execute(
                    text("INSERT INTO asset_categories (id, name, display_order, created_at, updated_at) VALUES (:id, :name, :display_order, :created_at, :updated_at)"),
                    {"id": cat_id, "name": cat_dict["name"], "display_order": cat_dict["display_order"], "created_at": now_utc, "updated_at": now_utc}
                )
                for sub_dict in cat_dict["sub_categories"]:
                    sub_id = str(uuid.uuid4())
                    sync_conn.execute(
                        text("INSERT INTO asset_sub_categories (id, asset_category_id, name, is_liquid, display_order, created_at, updated_at) VALUES (:id, :asset_category_id, :name, :is_liquid, :display_order, :created_at, :updated_at)"),
                        {
                            "id": sub_id,
                            "asset_category_id": cat_id,
                            "name": sub_dict["name"],
                            "is_liquid": sub_dict["is_liquid"],
                            "display_order": sub_dict["display_order"],
                            "created_at": now_utc,
                            "updated_at": now_utc
                        }
                    )

        # 2. Seed liability categories from JSON file if empty
        liab_cat_count = sync_conn.execute(text("SELECT COUNT(*) FROM liability_categories")).scalar()
        if not liab_cat_count and liability_seed_path.exists():
            with open(liability_seed_path, "r", encoding="utf-8") as f:
                liability_categories_data = json.load(f)

            for l_dict in liability_categories_data:
                l_id = str(uuid.uuid4())
                sync_conn.execute(
                    text("INSERT INTO liability_categories (id, name, description, display_order, created_at, updated_at) VALUES (:id, :name, :description, :display_order, :created_at, :updated_at)"),
                    {
                        "id": l_id,
                        "name": l_dict["name"],
                        "description": l_dict.get("description"),
                        "display_order": l_dict.get("display_order", 0),
                        "created_at": now_utc,
                        "updated_at": now_utc
                    }
                )

    async with engine.begin() as conn:
        await conn.run_sync(_sync_init)
