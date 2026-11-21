from datetime import date, datetime, timezone
from decimal import Decimal
import math
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.asset import Asset
from app.models.fire_scenario import FireScenario
from app.schemas.fire import (
    FireCalculationMetrics,
    FireCalculateRequest,
    FireScenarioResponse,
    FireScenarioSummary,
    TrajectoryPoint,
)
from app.services.fx import fx_service


class FireService:
    @staticmethod
    async def get_liquid_assets_portfolio(user: User, db: AsyncSession) -> Decimal:
        """
        Calculates user's total investable FIRE portfolio by selecting all assets
        where exclude_from_fire == False, converting each to user's base currency.
        """
        query = select(Asset).where(
            Asset.user_id == user.id,
            Asset.exclude_from_fire == False
        )
        result = await db.execute(query)
        assets = result.scalars().all()

        base_curr = (user.base_currency or "INR").upper()
        total_liquid = Decimal("0.00")

        for asset in assets:
            converted = await fx_service.convert_amount(
                amount=Decimal(str(asset.amount)),
                from_currency=asset.currency,
                to_currency=base_curr
            )
            total_liquid += converted

        return total_liquid.quantize(Decimal("0.01"))

    @staticmethod
    def calculate_metrics(
        dob: Optional[date],
        monthly_expenses_retirement: Decimal,
        retirement_age_goal: float,
        monthly_contribution: Decimal,
        tax_rate_retirement: float,
        swr: float,
        expected_annual_return: float,
        inflation: float,
        contribution_growth_rate: float,
        current_liquid_portfolio: Decimal,
        base_currency: str = "INR"
    ) -> Tuple[FireCalculationMetrics, List[TrajectoryPoint]]:
        today = datetime.now(timezone.utc).date()

        # 1. Determine Current Age
        if dob:
            current_age = round((today - dob).days / 365.25, 2)
        else:
            # Default to 30.0 if not yet set
            current_age = 30.0

        years_to_goal = max(0.0, retirement_age_goal - current_age)
        months_to_goal = int(round(years_to_goal * 12))

        # 2. Return Rates (Fisher Equation for Real Return)
        # r_real = (1 + r_nom) / (1 + i) - 1
        denom = 1.0 + inflation
        if abs(denom) < 1e-9:
            real_return = expected_annual_return - inflation
        else:
            real_return = (1.0 + expected_annual_return) / denom - 1.0

        # Monthly real return rate (compounded)
        if real_return > -1.0:
            monthly_real_return = (1.0 + real_return) ** (1.0 / 12.0) - 1.0
        else:
            monthly_real_return = real_return / 12.0

        # 3. Expenses & Gross Spending
        annual_expenses = (monthly_expenses_retirement * Decimal("12")).quantize(Decimal("0.01"))
        tax_rate_capped = min(max(0.0, tax_rate_retirement), 0.90)
        net_tax_factor = Decimal(str(round(1.0 - tax_rate_capped, 6)))
        if net_tax_factor <= Decimal("0.0001"):
            gross_annual_spending = annual_expenses
        else:
            gross_annual_spending = (annual_expenses / net_tax_factor).quantize(Decimal("0.01"))

        # 4. FI Targets
        swr_safe = max(0.001, swr)
        real_full_fi_target = (gross_annual_spending / Decimal(str(swr_safe))).quantize(Decimal("0.01"))

        # Nominal FI target adjusted for inflation over the years until retirement
        inflation_multiplier = (1.0 + inflation) ** years_to_goal
        nominal_full_fi_target = (real_full_fi_target * Decimal(str(round(inflation_multiplier, 6)))).quantize(Decimal("0.01"))

        # 5. Projected Portfolio at Goal Retirement Age
        P0 = float(current_liquid_portfolio)
        C = float(monthly_contribution)
        rm = monthly_real_return
        gc = contribution_growth_rate

        curr_p = P0
        for m in range(1, months_to_goal + 1):
            year_idx = (m - 1) // 12
            monthly_c = C * ((1.0 + gc) ** year_idx)
            curr_p = curr_p * (1.0 + rm) + monthly_c

        projected_portfolio_retire = Decimal(str(round(max(0.0, curr_p), 2))).quantize(Decimal("0.01"))

        # 6. Monthly Contribution Needed to Hit Goal Age
        target_real = float(real_full_fi_target)
        fv_p0 = P0 * ((1.0 + rm) ** months_to_goal)
        shortfall = max(0.0, target_real - fv_p0)

        if shortfall <= 0.0:
            monthly_contribution_needed = Decimal("0.00")
        elif months_to_goal <= 0:
            monthly_contribution_needed = Decimal(str(round(shortfall, 2))).quantize(Decimal("0.01"))
        else:
            # Calculate annuity accumulation weight
            weight = sum(((1.0 + gc) ** ((m - 1) // 12)) * ((1.0 + rm) ** (months_to_goal - m)) for m in range(1, months_to_goal + 1))
            if weight > 1e-9:
                monthly_contribution_needed = Decimal(str(round(shortfall / weight, 2))).quantize(Decimal("0.01"))
            else:
                monthly_contribution_needed = Decimal(str(round(shortfall / months_to_goal, 2))).quantize(Decimal("0.01"))

        gap_vs_current = (monthly_contribution - monthly_contribution_needed).quantize(Decimal("0.01"))
        is_full_fi_now = P0 >= target_real

        # 7. Coast FI Baseline Metrics
        discount_factor = (1.0 + rm) ** months_to_goal
        if discount_factor > 1e-9:
            coast_fi_target_val = target_real / discount_factor
        else:
            coast_fi_target_val = target_real

        coast_fi_target = Decimal(str(round(max(0.0, coast_fi_target_val), 2))).quantize(Decimal("0.01"))
        coast_fi_gap = (current_liquid_portfolio - coast_fi_target).quantize(Decimal("0.01"))
        is_coast_fi = P0 >= float(coast_fi_target)

        # 8. Full FI & Coast FI Timeline Simulation
        full_fi_age: Optional[float] = None
        full_fi_year: Optional[int] = None
        full_fi_month: Optional[int] = None
        full_fi_variance: Optional[float] = None

        coast_fi_age: Optional[float] = None
        coast_fi_year: Optional[int] = None
        coast_fi_month: Optional[int] = None
        coast_fi_variance: Optional[float] = None

        hit_month_full = None
        hit_month_coast = None

        if is_full_fi_now:
            full_fi_age = current_age
            full_fi_year = today.year
            full_fi_month = today.month
            full_fi_variance = round(retirement_age_goal - current_age, 2)
            hit_month_full = 0

        if is_coast_fi:
            coast_fi_age = current_age
            coast_fi_year = today.year
            coast_fi_month = today.month
            coast_fi_variance = round(retirement_age_goal - current_age, 2)
            hit_month_coast = 0

        if hit_month_full is None or hit_month_coast is None:
            sim_p = P0
            max_sim_months = 1200  # Up to 100 years
            for m in range(1, max_sim_months + 1):
                y_idx = (m - 1) // 12
                c_step = C * ((1.0 + gc) ** y_idx)
                sim_p = sim_p * (1.0 + rm) + c_step

                # Check Coast FI threshold at month m
                if hit_month_coast is None:
                    m_remain = max(0.0, months_to_goal - m)
                    if m_remain > 0 and (1.0 + rm) > 0:
                        disc = (1.0 + rm) ** m_remain
                        coast_thresh = target_real / disc if disc > 1e-9 else target_real
                    else:
                        coast_thresh = target_real

                    if sim_p >= coast_thresh:
                        hit_month_coast = m
                        coast_fi_age = round(current_age + m / 12.0, 1)
                        coast_fi_year = today.year + (today.month + m - 1) // 12
                        coast_fi_month = (today.month + m - 1) % 12 + 1
                        coast_fi_variance = round(retirement_age_goal - coast_fi_age, 1)

                # Check Full FI threshold at month m
                if hit_month_full is None:
                    if sim_p >= target_real:
                        hit_month_full = m
                        full_fi_age = round(current_age + m / 12.0, 1)
                        full_fi_year = today.year + (today.month + m - 1) // 12
                        full_fi_month = (today.month + m - 1) % 12 + 1
                        full_fi_variance = round(retirement_age_goal - full_fi_age, 1)

                if hit_month_full is not None and hit_month_coast is not None:
                    break

        # 9. Trajectory Points (Yearly for charting from current age to age 85)
        trajectory: List[TrajectoryPoint] = []
        max_chart_age = max(85, int(retirement_age_goal + 15), int((full_fi_age or 70) + 10))
        sim_years = int(max_chart_age - current_age) + 1

        chart_p_real = P0
        chart_p_nom = P0
        for y in range(0, sim_years + 1):
            age_pt = round(current_age + y, 1)
            year_pt = today.year + y

            # Coast target at age_pt discounted back from retirement age
            remaining_years = max(0.0, retirement_age_goal - age_pt)
            discount_to_retire = (1.0 + real_return) ** remaining_years if remaining_years > 0 else 1.0
            pt_coast_target = target_real / discount_to_retire if discount_to_retire > 0 else target_real

            trajectory.append(
                TrajectoryPoint(
                    age=age_pt,
                    year=year_pt,
                    real_portfolio=Decimal(str(round(chart_p_real, 2))).quantize(Decimal("0.01")),
                    nominal_portfolio=Decimal(str(round(chart_p_nom, 2))).quantize(Decimal("0.01")),
                    coast_fi_target=Decimal(str(round(max(0.0, pt_coast_target), 2))).quantize(Decimal("0.01")),
                    real_full_fi_target=real_full_fi_target
                )
            )

            # Advance 1 year (12 months)
            annual_c = C * 12.0 * ((1.0 + gc) ** y)
            # If past retirement goal, assume contribution stops or retirement draw starts
            if age_pt >= retirement_age_goal:
                annual_c = 0.0

            chart_p_real = chart_p_real * (1.0 + real_return) + annual_c
            chart_p_nom = chart_p_nom * (1.0 + expected_annual_return) + annual_c

        metrics = FireCalculationMetrics(
            real_return_rate=round(real_return * 100.0, 2),
            monthly_real_return_rate=round(monthly_real_return * 100.0, 3),
            annual_expenses_retirement=annual_expenses,
            gross_annual_spending_needed=gross_annual_spending,
            real_full_fi_target=real_full_fi_target,
            nominal_full_fi_target=nominal_full_fi_target,
            current_age=current_age,
            years_to_goal_age=round(years_to_goal, 2),
            full_fi_age=full_fi_age,
            full_fi_year=full_fi_year,
            full_fi_month=full_fi_month,
            full_fi_timeline_variance=full_fi_variance,
            projected_portfolio_at_retirement=projected_portfolio_retire,
            monthly_contribution_needed=monthly_contribution_needed,
            gap_vs_current=gap_vs_current,
            is_full_fi_achieved_now=is_full_fi_now,
            coast_fi_target=coast_fi_target,
            coast_fi_gap=coast_fi_gap,
            coast_fi_age=coast_fi_age,
            coast_fi_year=coast_fi_year,
            coast_fi_month=coast_fi_month,
            coast_fi_timeline_variance=coast_fi_variance,
            is_coast_fi_achieved=is_coast_fi,
            current_liquid_portfolio=current_liquid_portfolio,
            base_currency=base_currency
        )

        return metrics, trajectory


fire_service = FireService()
