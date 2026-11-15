import pytest
import uuid
from datetime import date
from decimal import Decimal
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()
    yield


@pytest.mark.asyncio
async def test_categories_and_subcategories():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        unique_email = f"cat.{uuid.uuid4().hex[:8]}@piggybank.test"
        login_resp = await ac.post("/api/v1/auth/dev-login", json={
            "email": unique_email,
            "name": "Category Tester"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Fetch asset categories
        cat_resp = await ac.get("/api/v1/asset-categories", headers=headers)
        assert cat_resp.status_code == 200
        cats = cat_resp.json()
        assert len(cats) >= 5

        cat_names = [c["name"] for c in cats]
        assert "Cash & Bank" in cat_names
        assert "Real Estate" in cat_names
        assert "Commodities" in cat_names

        # Verify granular liquidity flags
        re_cat = next(c for c in cats if c["name"] == "Real Estate")
        re_subs = {s["name"]: s["is_liquid"] for s in re_cat["sub_categories"]}
        assert re_subs["Residential"] is False
        assert re_subs["Commercial"] is False
        assert re_subs["REIT"] is True

        com_cat = next(c for c in cats if c["name"] == "Commodities")
        com_subs = {s["name"]: s["is_liquid"] for s in com_cat["sub_categories"]}
        assert com_subs["Car"] is False
        assert com_subs["Digital Gold"] is True

        # Fetch liability categories
        liab_cat_resp = await ac.get("/api/v1/liability-categories", headers=headers)
        assert liab_cat_resp.status_code == 200
        liab_cats = liab_cat_resp.json()
        assert len(liab_cats) >= 5
        assert any(l["name"] == "Home Loan" for l in liab_cats)


@pytest.mark.asyncio
async def test_liquid_portfolio_and_fire_calculations():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        unique_email = f"fire.{uuid.uuid4().hex[:8]}@piggybank.test"
        login_resp = await ac.post("/api/v1/auth/dev-login", json={
            "email": unique_email,
            "name": "FIRE Planner"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Set user DOB (e.g. born 30 years ago: 1996-01-01)
        patch_user = await ac.patch("/api/v1/users/me", headers=headers, json={
            "dob": "1996-01-01"
        })
        assert patch_user.status_code == 200
        assert patch_user.json()["dob"] == "1996-01-01"

        # 3. Add Liquid Assets (Equity: 500,000 INR, REIT: 300,000 INR -> Total FIRE Liquid: 800,000 INR)
        # Emergency Fund is Cash & Bank (200,000 INR) with exclude_from_fire=True, so it is excluded from FIRE!
        await ac.post("/api/v1/assets", headers=headers, json={
            "name": "Nifty Index Fund",
            "category": "Equity",
            "sub_category": "Equity Mutual Fund",
            "amount": 500000.0,
            "currency": "INR"
        })
        await ac.post("/api/v1/assets", headers=headers, json={
            "name": "Emergency Fund",
            "category": "Cash & Bank",
            "sub_category": "Savings",
            "amount": 200000.0,
            "currency": "INR",
            "exclude_from_fire": True
        })
        await ac.post("/api/v1/assets", headers=headers, json={
            "name": "Embassy REIT",
            "category": "Real Estate",
            "sub_category": "REIT",
            "amount": 300000.0,
            "currency": "INR"
        })

        # 4. Add Illiquid Assets (Residential Apartment: 5,000,000 INR, Personal Car: 800,000 INR)
        # These MUST be excluded from liquid portfolio!
        await ac.post("/api/v1/assets", headers=headers, json={
            "name": "Primary Residence",
            "category": "Real Estate",
            "sub_category": "Residential",
            "amount": 5000000.0,
            "currency": "INR"
        })
        await ac.post("/api/v1/assets", headers=headers, json={
            "name": "Sedan Car",
            "category": "Commodities",
            "sub_category": "Car",
            "amount": 800000.0,
            "currency": "INR"
        })

        # 5. List scenarios (initially empty because user hasn't created one yet)
        empty_sc_resp = await ac.get("/api/v1/fire/scenarios", headers=headers)
        assert empty_sc_resp.status_code == 200
        assert empty_sc_resp.json() == []

        # 6. User creates their first scenario
        create_sc_resp = await ac.post("/api/v1/fire/scenarios", headers=headers, json={
            "name": "My Plan",
            "description": "User's primary retirement plan",
            "is_default": True,
            "monthly_expenses_retirement": 50000.0,
            "retirement_age_goal": 55.0,
            "monthly_contribution": 25000.0,
            "tax_rate_retirement": 0.15,
            "swr": 0.04,
            "expected_annual_return": 0.10,
            "inflation": 0.06,
            "contribution_growth_rate": 0.05
        })
        assert create_sc_resp.status_code == 201
        first_sc = create_sc_resp.json()
        default_sc_id = first_sc["id"]
        assert first_sc["is_default"] is True

        # 7. Fetch full scenario and verify calculations
        sc_resp = await ac.get(f"/api/v1/fire/scenarios/{default_sc_id}", headers=headers)
        assert sc_resp.status_code == 200
        data = sc_resp.json()
        metrics = data["metrics"]

        # Verify liquid portfolio is exactly 800,000 INR (Emergency Fund 200,000 + 5,800,000 illiquid assets correctly excluded!)
        assert float(metrics["current_liquid_portfolio"]) == 800000.0
        assert metrics["current_age"] >= 29.0
        assert metrics["real_return_rate"] > 0
        assert metrics["monthly_real_return_rate"] > 0
        assert float(metrics["real_full_fi_target"]) > 0
        assert float(metrics["nominal_full_fi_target"]) >= float(metrics["real_full_fi_target"])
        assert float(metrics["coast_fi_target"]) > 0
        assert "gap_vs_current" in metrics
        assert "full_fi_timeline_variance" in metrics
        assert len(data["trajectory"]) > 0

        # 8. Create a second custom scenario ("Early FIRE at 45")
        new_sc_resp = await ac.post("/api/v1/fire/scenarios", headers=headers, json={
            "name": "Early FIRE at 45",
            "description": "Retire aggressively at 45",
            "is_default": False,
            "monthly_expenses_retirement": 60000.0,
            "retirement_age_goal": 45.0,
            "monthly_contribution": 50000.0,
            "tax_rate_retirement": 0.15,
            "swr": 0.04,
            "expected_annual_return": 0.12,
            "inflation": 0.06,
            "contribution_growth_rate": 0.05
        })
        assert new_sc_resp.status_code == 201
        new_sc = new_sc_resp.json()
        new_sc_id = new_sc["id"]
        assert new_sc["name"] == "Early FIRE at 45"
        assert float(new_sc["retirement_age_goal"]) == 45.0
        assert float(new_sc["metrics"]["current_liquid_portfolio"]) == 800000.0

        # 9. Compare scenarios
        compare_resp = await ac.post("/api/v1/fire/scenarios/compare", headers=headers, json={
            "scenario_ids": [default_sc_id, new_sc_id]
        })
        assert compare_resp.status_code == 200
        comp_data = compare_resp.json()
        assert len(comp_data["scenarios"]) == 2

        # 10. Test Scratchpad Calculate endpoint without persisting
        scratch_resp = await ac.post("/api/v1/fire/calculate", headers=headers, json={
            "monthly_expenses_retirement": 40000.0,
            "retirement_age_goal": 50.0,
            "monthly_contribution": 30000.0,
            "tax_rate_retirement": 0.10,
            "swr": 0.035,
            "expected_annual_return": 0.11,
            "inflation": 0.05,
            "contribution_growth_rate": 0.05
        })
        assert scratch_resp.status_code == 200
        scratch_data = scratch_resp.json()
        assert scratch_data["id"] == "scratchpad"
        assert float(scratch_data["metrics"]["current_liquid_portfolio"]) == 800000.0

        # 11. Switch default scenario
        set_def = await ac.post(f"/api/v1/fire/scenarios/{new_sc_id}/set-default", headers=headers)
        assert set_def.status_code == 200
        assert set_def.json()["is_default"] is True

        # Check list again to confirm default changed
        list_again = await ac.get("/api/v1/fire/scenarios", headers=headers)
        sc_map = {s["id"]: s["is_default"] for s in list_again.json()}
        assert sc_map[new_sc_id] is True
        assert sc_map[default_sc_id] is False

        # 12. Delete scenario
        del_resp = await ac.delete(f"/api/v1/fire/scenarios/{new_sc_id}", headers=headers)
        assert del_resp.status_code == 204


@pytest.mark.asyncio
async def test_fire_mathematical_precision_and_edge_cases():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        unique_email = f"math.{uuid.uuid4().hex[:8]}@piggybank.test"
        login_resp = await ac.post("/api/v1/auth/dev-login", json={
            "email": unique_email,
            "name": "Math Tester"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # User age: Exactly 30 years old today
        today = date.today()
        dob_30 = date(today.year - 30, today.month, today.day)

        # 1. Test calculation with known exact numbers:
        # Expenses: 50,000/mo -> 600,000/yr
        # Tax: 20% -> Gross = 600,000 / 0.8 = 750,000
        # SWR: 4% -> Real FI Target = 750,000 / 0.04 = 18,750,000
        # Nominal return: 10%, Inflation: 6% -> Real return: (1.10 / 1.06) - 1 = 3.77%
        # Retirement Goal: 50 (20 years horizon)
        calc_resp = await ac.post("/api/v1/fire/calculate", headers=headers, json={
            "dob": dob_30.isoformat(),
            "monthly_expenses_retirement": 50000.0,
            "retirement_age_goal": 50.0,
            "monthly_contribution": 20000.0,
            "tax_rate_retirement": 0.20,
            "swr": 0.04,
            "expected_annual_return": 0.10,
            "inflation": 0.06,
            "contribution_growth_rate": 0.0,
            "custom_liquid_override": 1000000.0
        })
        assert calc_resp.status_code == 200
        m = calc_resp.json()["metrics"]

        # Assert mathematical outputs
        assert m["current_age"] == 30.0
        assert m["years_to_goal_age"] == 20.0
        assert m["real_return_rate"] == 3.77
        assert float(m["annual_expenses_retirement"]) == 600000.0
        assert float(m["gross_annual_spending_needed"]) == 750000.0
        assert float(m["real_full_fi_target"]) == 18750000.0
        # Nominal target: 18,750,000 * (1.06)^20 ≈ 60,133,803.95
        assert 60000000.0 < float(m["nominal_full_fi_target"]) < 61000000.0

        # Coast FI Target: 18,750,000 / (1.037736)^20 ≈ 8,924,535
        assert 8000000.0 < float(m["coast_fi_target"]) < 9500000.0
        assert m["is_coast_fi_achieved"] is False
        assert float(m["coast_fi_gap"]) < 0  # Deficit

        # 2. Test already achieved Full FI
        # Liquid portfolio = 20,000,000 (exceeds 18,750,000)
        achieved_resp = await ac.post("/api/v1/fire/calculate", headers=headers, json={
            "dob": dob_30.isoformat(),
            "monthly_expenses_retirement": 50000.0,
            "retirement_age_goal": 50.0,
            "monthly_contribution": 10000.0,
            "tax_rate_retirement": 0.20,
            "swr": 0.04,
            "expected_annual_return": 0.10,
            "inflation": 0.06,
            "contribution_growth_rate": 0.0,
            "custom_liquid_override": 20000000.0
        })
        assert achieved_resp.status_code == 200
        am = achieved_resp.json()["metrics"]
        assert am["is_full_fi_achieved_now"] is True
        assert am["is_coast_fi_achieved"] is True
        assert float(am["monthly_contribution_needed"]) == 0.0
        assert float(am["gap_vs_current"]) == 10000.0  # Entire contribution is surplus
        assert am["full_fi_age"] == 30.0
        assert am["full_fi_timeline_variance"] == 20.0  # 20 years ahead of age 50 goal


@pytest.mark.asyncio
async def test_fire_scenario_base_currency_conversion():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        unique_email = f"fxfire.{uuid.uuid4().hex[:8]}@piggybank.test"
        login_resp = await ac.post("/api/v1/auth/dev-login", json={
            "email": unique_email,
            "name": "FX FIRE User"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # User starts with INR base currency
        patch_user = await ac.patch("/api/v1/users/me", headers=headers, json={
            "dob": "1990-01-01",
            "base_currency": "INR"
        })
        assert patch_user.status_code == 200

        # Create scenario in INR
        create_resp = await ac.post("/api/v1/fire/scenarios", headers=headers, json={
            "name": "INR Plan",
            "currency": "INR",
            "monthly_expenses_retirement": 100000.0,
            "retirement_age_goal": 50.0,
            "monthly_contribution": 50000.0,
            "tax_rate_retirement": 0.12,
            "swr": 0.03,
            "expected_annual_return": 0.10,
            "inflation": 0.06,
            "contribution_growth_rate": 0.05
        })
        assert create_resp.status_code == 201
        data = create_resp.json()
        scenario_id = data["id"]
        inr_target = float(data["metrics"]["real_full_fi_target"])
        # Should be ~45,454,545 INR
        assert 45000000.0 < inr_target < 46000000.0
        assert float(data["monthly_expenses_retirement"]) == 100000.0

        # Switch user base currency to USD
        patch_user_usd = await ac.patch("/api/v1/users/me", headers=headers, json={
            "base_currency": "USD"
        })
        assert patch_user_usd.status_code == 200
        assert patch_user_usd.json()["base_currency"] == "USD"

        # Fetch scenario again - it should be converted to USD!
        get_resp = await ac.get(f"/api/v1/fire/scenarios/{scenario_id}", headers=headers)
        assert get_resp.status_code == 200
        usd_data = get_resp.json()

        usd_target = float(usd_data["metrics"]["real_full_fi_target"])
        usd_expenses = float(usd_data["monthly_expenses_retirement"])
        usd_contribution = float(usd_data["monthly_contribution"])

        # Target in USD should be ~$500,000 - $600,000, NOT 45,000,000!
        assert 450000.0 < usd_target < 650000.0
        assert 1000.0 < usd_expenses < 1500.0
        assert 500.0 < usd_contribution < 800.0

        # List scenarios should also reflect USD conversion
        list_resp = await ac.get("/api/v1/fire/scenarios", headers=headers)
        assert list_resp.status_code == 200
        summaries = list_resp.json()
        assert len(summaries) == 1
        assert 450000.0 < float(summaries[0]["real_full_fi_target"]) < 650000.0

