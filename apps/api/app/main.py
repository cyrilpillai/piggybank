from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import (
    auth,
    users,
    assets,
    liabilities,
    currencies,
    dashboard,
    asset_categories,
    liability_categories,
    fire,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist
    await init_db()
    yield
    # Shutdown logic if any


app = FastAPI(
    title="Piggybank API",
    description="Personal Net Worth Tracker Backend & AI Companion Engine",
    version="0.2.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
origins = settings.cors_origins
for default_origin in [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]:
    if default_origin not in origins:
        origins.append(default_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """
    Lightweight healthcheck endpoint for Cloud Run and keep-warm pingers.
    """
    return {
        "status": "healthy",
        "service": "piggybank-api",
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# Mount API v1 Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(assets.router, prefix="/api/v1")
app.include_router(liabilities.router, prefix="/api/v1")
app.include_router(currencies.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(asset_categories.router, prefix="/api/v1")
app.include_router(liability_categories.router, prefix="/api/v1")
app.include_router(fire.router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
