import pytest
from decimal import Decimal
import httpx
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.fx import FXService, STATIC_USD_RATES


@pytest.mark.asyncio
async def test_fx_service_direct_base_match(monkeypatch):
    """
    Test when api.exchangerate.fun returns rates matching requested base currency directly.
    """
    service = FXService()

    class MockResponse:
        status_code = 200

        def json(self):
            return {
                "timestamp": 1729598400,
                "base": "EUR",
                "rates": {
                    "USD": 1.08,
                    "GBP": 0.85,
                    "INR": 93.5,
                }
            }

    async def mock_get(self, url, headers=None):
        assert "base=EUR" in url
        return MockResponse()

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    rates = await service.get_rates_for_base("EUR")
    assert rates["EUR"] == 1.0
    assert rates["USD"] == 1.08
    assert rates["GBP"] == 0.85
    assert rates["INR"] == 93.5

    # Check cache was populated
    assert "EUR" in service._cache
    assert service._cache["EUR"]["rates"]["USD"] == 1.08

    # Second call should use cache without hitting network
    call_count = 0

    async def mock_get_counting(self, url, headers=None):
        nonlocal call_count
        call_count += 1
        return MockResponse()

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get_counting)
    cached_rates = await service.get_rates_for_base("eur")
    assert call_count == 0
    assert cached_rates["USD"] == 1.08


@pytest.mark.asyncio
async def test_fx_service_rebase_logic(monkeypatch):
    """
    Test when api.exchangerate.fun returns rates based on USD (default),
    and the service must rebase rates to the requested base (e.g., EUR).
    """
    service = FXService()

    class MockResponse:
        status_code = 200

        def json(self):
            return {
                "timestamp": 1729598400,
                "base": "USD",
                "rates": {
                    "EUR": 0.5,    # 1 USD = 0.5 EUR => 1 EUR = 2.0 USD
                    "GBP": 0.4,    # 1 USD = 0.4 GBP => 1 EUR = 0.8 GBP
                    "INR": 80.0,   # 1 USD = 80 INR  => 1 EUR = 160 INR
                }
            }

    async def mock_get(self, url, headers=None):
        return MockResponse()

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    rates = await service.get_rates_for_base("EUR")
    assert rates["EUR"] == 1.0
    assert rates["USD"] == pytest.approx(2.0, rel=1e-4)
    assert rates["GBP"] == pytest.approx(0.8, rel=1e-4)
    assert rates["INR"] == pytest.approx(160.0, rel=1e-4)


@pytest.mark.asyncio
async def test_fx_service_fallback_on_network_error(monkeypatch):
    """
    Test that FXService gracefully falls back to STATIC_USD_RATES when external API fails.
    """
    service = FXService()

    async def mock_get_fail(self, url, headers=None):
        raise httpx.ConnectError("Connection refused")

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get_fail)

    rates = await service.get_rates_for_base("USD")
    assert rates["USD"] == 1.0
    assert rates["INR"] == STATIC_USD_RATES["INR"]


@pytest.mark.asyncio
async def test_convert_amount(monkeypatch):
    """
    Test amount conversions: identity, zero amount, live rates, and fallback.
    """
    service = FXService()

    # Zero amount
    zero_conv = await service.convert_amount(Decimal("0.00"), "USD", "EUR")
    assert zero_conv == Decimal("0.00")

    # Same currency
    same_conv = await service.convert_amount(Decimal("100.50"), "USD", "USD")
    assert same_conv == Decimal("100.50")

    # Mocked rates conversion
    class MockResponse:
        status_code = 200

        def json(self):
            return {
                "timestamp": 1729598400,
                "base": "USD",
                "rates": {
                    "EUR": 0.90,
                    "INR": 86.0,
                }
            }

    async def mock_get(self, url, headers=None):
        return MockResponse()

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    # 100 USD to EUR at rate 0.90 => 90.00 EUR
    converted = await service.convert_amount(Decimal("100.00"), "USD", "EUR")
    assert converted == Decimal("90.00")


@pytest.mark.asyncio
async def test_currencies_rates_api_endpoint(monkeypatch):
    """
    Test GET /api/v1/currencies/rates endpoint with dev user auth.
    """
    from app.services.fx import fx_service

    async def mock_get_rates(base_currency):
        return {"EUR": 1.0, "USD": 1.09, "GBP": 0.84}

    monkeypatch.setattr(fx_service, "get_rates_for_base", mock_get_rates)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_resp = await ac.post("/api/v1/auth/dev-login", json={
            "email": "test.fx@piggybank.test",
            "name": "FX Tester"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        resp = await ac.get("/api/v1/currencies/rates?base=EUR", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["base"] == "EUR"
        assert "rates" in data
        assert data["rates"]["EUR"] == 1.0
        assert data["rates"]["USD"] == 1.09

