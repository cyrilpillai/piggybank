import os
from typing import List
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./piggybank_dev.db"
    
    # JWT & Security
    JWT_SECRET: str = "dev-secret-change-in-production-please-32chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30    # 30 days
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    # Defaults
    DEFAULT_BASE_CURRENCY: str = "INR"

    model_config = SettingsConfigDict(
        env_file=".env.dev",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @model_validator(mode="after")
    def validate_production_configuration(self) -> "Settings":
        """
        Enforce strict security requirements when running in production.
        Prevents insecure defaults or fallback database drivers from starting.
        """
        if self.ENVIRONMENT.lower() in ("production", "prod"):
            dev_default = "dev-secret-change-in-production-please-32chars"
            if self.JWT_SECRET == dev_default or len(self.JWT_SECRET) < 32:
                raise ValueError(
                    "Security violation: JWT_SECRET must be configured with a random string "
                    "of at least 32 characters in production."
                )
            if "sqlite" in self.DATABASE_URL.lower():
                raise ValueError(
                    "Configuration violation: SQLite cannot be used as DATABASE_URL in production."
                )
        return self

    @property
    def cors_origins(self) -> List[str]:
        raw = self.ALLOWED_ORIGINS.replace(";", ",").replace(" ", ",")
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    @property
    def async_database_url(self) -> str:
        """
        Ensures the database URL has the async driver prefix for asyncpg.
        Fixes neon or heroku postgres URLs starting with 'postgres://' or 'postgresql://'.
        """
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif "sqlite" in url and "///./" in url:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            db_name = url.split("///./", 1)[1]
            abs_db_path = os.path.join(base_dir, db_name)
            url = f"sqlite+aiosqlite:///{abs_db_path}"
        return url


settings = Settings()
