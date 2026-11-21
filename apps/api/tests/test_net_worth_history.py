import pytest
import uuid
from decimal import Decimal
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()
    yield


@pytest.mark.asyncio
async def test_net_worth_history_flow():
    unique_email = f"history.{uuid.uuid4().hex[:8]}@piggybank.test"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login user
        login_resp = await ac.post("/api/v1/auth/dev-login", json={
            "email": unique_email,
            "name": "History Tester"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Initially empty history should return today with 0 net worth
        hist_resp = await ac.get("/api/v1/dashboard/history?range=1M", headers=headers)
        assert hist_resp.status_code == 200
        data = hist_resp.json()
        assert data["range"] == "1M"
        assert len(data["points"]) >= 1
        assert float(data["points"][-1]["net_worth"]) == 0.0

        # 3. Add an asset
        asset_resp = await ac.post("/api/v1/assets", headers=headers, json={
            "name": "Nifty Index Fund",
            "category": "Equity",
            "sub_category": "Equity Mutual Fund",
            "amount": 250000.00,
            "currency": "INR",
            "institution": "Zerodha"
        })
        assert asset_resp.status_code == 201

        # 4. Check history again - today's snapshot should now show 250,000 net worth
        hist_resp2 = await ac.get("/api/v1/dashboard/history?range=1M", headers=headers)
        assert hist_resp2.status_code == 200
        data2 = hist_resp2.json()
        assert float(data2["points"][-1]["net_worth"]) == 250000.00
        assert float(data2["points"][-1]["total_assets"]) == 250000.00
        assert float(data2["points"][-1]["total_liabilities"]) == 0.00

        # 5. Add a liability
        liab_resp = await ac.post("/api/v1/liabilities", headers=headers, json={
            "name": "Credit Card",
            "category": "Credit Card",
            "amount": 50000.00,
            "currency": "INR"
        })
        assert liab_resp.status_code == 201

        # 6. Check history - net worth should now be 200,000
        hist_resp3 = await ac.get("/api/v1/dashboard/history?range=3M", headers=headers)
        assert hist_resp3.status_code == 200
        data3 = hist_resp3.json()
        assert float(data3["points"][-1]["net_worth"]) == 200000.00
        assert float(data3["points"][-1]["total_assets"]) == 250000.00
        assert float(data3["points"][-1]["total_liabilities"]) == 50000.00

        # 7. Check with currency conversion (e.g. USD)
        hist_usd = await ac.get("/api/v1/dashboard/history?range=1M&currency=USD", headers=headers)
        assert hist_usd.status_code == 200
        data_usd = hist_usd.json()
        assert data_usd["currency"] == "USD"
        assert float(data_usd["points"][-1]["net_worth"]) > 0
        assert float(data_usd["points"][-1]["net_worth"]) < 200000.00
