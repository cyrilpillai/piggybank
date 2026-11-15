import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()
    yield


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "piggybank-api"


@pytest.mark.asyncio
async def test_endpoint_security_and_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Unauthenticated requests to protected endpoints MUST fail with 401
        unauth_curr = await ac.get("/api/v1/currencies/supported")
        assert unauth_curr.status_code == 401

        unauth_assets = await ac.get("/api/v1/assets")
        assert unauth_assets.status_code == 401

        unauth_categories = await ac.get("/api/v1/assets/categories")
        assert unauth_categories.status_code == 401

        unauth_liabs = await ac.get("/api/v1/liabilities")
        assert unauth_liabs.status_code == 401

        unauth_dash = await ac.get("/api/v1/dashboard/summary")
        assert unauth_dash.status_code == 401

        # 2. Authenticate via dev login
        login_resp = await ac.post("/api/v1/auth/dev-login", json={
            "email": "test.security@piggybank.test",
            "name": "Security Tester"
        })
        assert login_resp.status_code == 200
        tokens = login_resp.json()
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]

        headers = {"Authorization": f"Bearer {access_token}"}

        # 3. Authenticated request to currencies succeeds
        auth_curr = await ac.get("/api/v1/currencies/supported", headers=headers)
        assert auth_curr.status_code == 200
        codes = [c["code"] for c in auth_curr.json()]
        assert "USD" in codes
        assert "INR" in codes

        # 4. Test Token Refresh
        refresh_resp = await ac.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token
        })
        assert refresh_resp.status_code == 200
        new_tokens = refresh_resp.json()
        assert "access_token" in new_tokens
        assert "refresh_token" in new_tokens
        assert new_tokens["access_token"] != access_token

        # 5. New access token works
        new_headers = {"Authorization": f"Bearer {new_tokens['access_token']}"}
        categories_resp = await ac.get("/api/v1/assets/categories", headers=new_headers)
        assert categories_resp.status_code == 200

        liab_cats_resp = await ac.get("/api/v1/liabilities/categories", headers=new_headers)
        assert liab_cats_resp.status_code == 200
        liab_cats = liab_cats_resp.json()
        assert len(liab_cats) >= 5
        assert any(c["name"] == "Home Loan" for c in liab_cats)


@pytest.mark.asyncio
async def test_dev_login_and_crud():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Dev login with isolated test user
        login_resp = await ac.post("/api/v1/auth/dev-login", json={
            "email": "test.crud@piggybank.test",
            "name": "CRUD Tester"
        })
        assert login_resp.status_code == 200
        login_data = login_resp.json()
        assert login_data["user"]["base_currency"] == "INR"
        token = login_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Add an Asset in INR (e.g. Zerodha Demat Portfolio)
        asset_resp = await ac.post("/api/v1/assets", headers=headers, json={
            "name": "Zerodha Equities",
            "category": "Equity",
            "sub_category": "Direct Equity Stocks",
            "amount": 865000.0,
            "currency": "INR",
            "institution": "Zerodha"
        })
        assert asset_resp.status_code == 201
        asset_data = asset_resp.json()
        assert asset_data["category"] == "Equity"
        assert asset_data["sub_category"] == "Direct Equity Stocks"
        asset_id = asset_data["id"]

        # 3. Add a Liability in USD (e.g. Home Loan)
        liab_resp = await ac.post("/api/v1/liabilities", headers=headers, json={
            "name": "Primary Home Loan",
            "category": "Home Loan",
            "amount": 2000.0,
            "currency": "USD",
            "interest_rate": 6.5
        })
        assert liab_resp.status_code == 201
        liab_data = liab_resp.json()
        assert liab_data["category"] == "Home Loan"
        liab_id = liab_data["id"]

        # 4. Check dashboard in USD
        dash_usd = await ac.get("/api/v1/dashboard/summary?currency=USD", headers=headers)
        assert dash_usd.status_code == 200
        usd_summary = dash_usd.json()["summary"]
        assert usd_summary["base_currency"] == "USD"
        assert float(usd_summary["total_assets"]) > 0
        assert float(usd_summary["total_liabilities"]) == 2000.0
        assert float(usd_summary["net_worth"]) > 0

        # 5. Check dashboard in INR
        dash_inr = await ac.get("/api/v1/dashboard/summary?currency=INR", headers=headers)
        assert dash_inr.status_code == 200
        inr_summary = dash_inr.json()["summary"]
        assert inr_summary["base_currency"] == "INR"

        # 6. Cleanup
        del_asset = await ac.delete(f"/api/v1/assets/{asset_id}", headers=headers)
        assert del_asset.status_code == 204
        del_liab = await ac.delete(f"/api/v1/liabilities/{liab_id}", headers=headers)
        assert del_liab.status_code == 204


@pytest.mark.asyncio
async def test_dev_login_disabled_in_production(monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/v1/auth/dev-login", json={
            "email": "hacker@example.com",
            "name": "Hacker"
        })
        assert resp.status_code == 403
        assert "only available in development" in resp.json()["detail"].lower()


def test_production_settings_validation():
    from app.config import Settings
    from pydantic import ValidationError

    # Default dev secret in production must fail validation
    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET="dev-secret-change-in-production-please-32chars",
            DATABASE_URL="postgresql+asyncpg://user:pass@host/db"
        )

    # SQLite database in production must fail validation
    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET="super-secure-production-random-jwt-secret-string-at-least-32chars",
            DATABASE_URL="sqlite+aiosqlite:///./test.db"
        )

    # Valid production settings pass
    valid_settings = Settings(
        ENVIRONMENT="production",
        JWT_SECRET="super-secure-production-random-jwt-secret-string-at-least-32chars",
        DATABASE_URL="postgresql+asyncpg://user:pass@host/db"
    )
    assert valid_settings.ENVIRONMENT == "production"
