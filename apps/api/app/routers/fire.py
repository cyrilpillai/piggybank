from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database import get_db
from app.models.user import User
from app.models.fire_scenario import FireScenario
from app.schemas.fire import (
    FireScenarioCreate,
    FireScenarioUpdate,
    FireScenarioResponse,
    FireScenarioSummary,
    FireCalculateRequest,
    FireCalculationMetrics,
    FireCompareRequest,
    FireCompareResponse,
)
from app.services.auth import get_current_user
from app.services.fire import fire_service
from app.services.fx import fx_service

router = APIRouter(prefix="/fire", tags=["FIRE Calculator"])


async def _build_scenario_response(
    scenario: FireScenario,
    user: User,
    db: AsyncSession,
    target_currency: Optional[str] = None
) -> FireScenarioResponse:
    target_curr = (target_currency or user.base_currency or "INR").upper()
    source_curr = (getattr(scenario, "currency", None) or "INR").upper()

    if source_curr != target_curr:
        expenses = await fx_service.convert_amount(
            Decimal(str(scenario.monthly_expenses_retirement)),
            source_curr,
            target_curr
        )
        contribution = await fx_service.convert_amount(
            Decimal(str(scenario.monthly_contribution)),
            source_curr,
            target_curr
        )
        if scenario.custom_liquid_override is not None and scenario.custom_liquid_override > Decimal("0.00"):
            custom_override = await fx_service.convert_amount(
                Decimal(str(scenario.custom_liquid_override)),
                source_curr,
                target_curr
            )
            liquid_assets = custom_override
        else:
            custom_override = None
            liquid_assets = await fire_service.get_liquid_assets_portfolio(user, db)
    else:
        expenses = Decimal(str(scenario.monthly_expenses_retirement))
        contribution = Decimal(str(scenario.monthly_contribution))
        if scenario.custom_liquid_override is not None and scenario.custom_liquid_override > Decimal("0.00"):
            custom_override = Decimal(str(scenario.custom_liquid_override))
            liquid_assets = custom_override
        else:
            custom_override = None
            liquid_assets = await fire_service.get_liquid_assets_portfolio(user, db)

    metrics, trajectory = fire_service.calculate_metrics(
        dob=user.dob,
        monthly_expenses_retirement=expenses,
        retirement_age_goal=float(scenario.retirement_age_goal),
        monthly_contribution=contribution,
        tax_rate_retirement=float(scenario.tax_rate_retirement),
        swr=float(scenario.swr),
        expected_annual_return=float(scenario.expected_annual_return),
        inflation=float(scenario.inflation),
        contribution_growth_rate=float(scenario.contribution_growth_rate),
        current_liquid_portfolio=liquid_assets,
        base_currency=target_curr
    )

    return FireScenarioResponse(
        id=scenario.id,
        user_id=scenario.user_id,
        name=scenario.name,
        description=scenario.description,
        is_default=scenario.is_default,
        currency=target_curr,
        monthly_expenses_retirement=expenses,
        retirement_age_goal=float(scenario.retirement_age_goal),
        monthly_contribution=contribution,
        tax_rate_retirement=float(scenario.tax_rate_retirement),
        swr=float(scenario.swr),
        expected_annual_return=float(scenario.expected_annual_return),
        inflation=float(scenario.inflation),
        contribution_growth_rate=float(scenario.contribution_growth_rate),
        custom_liquid_override=custom_override,
        created_at=scenario.created_at,
        updated_at=scenario.updated_at,
        metrics=metrics,
        trajectory=trajectory
    )


@router.get("/scenarios", response_model=List[FireScenarioSummary])
async def list_scenarios(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists all saved FIRE scenarios for the user with calculated summary metrics.
    """
    result = await db.execute(
        select(FireScenario)
        .where(FireScenario.user_id == current_user.id)
        .order_by(FireScenario.is_default.desc(), FireScenario.created_at.asc())
    )
    scenarios = result.scalars().all()

    if not scenarios:
        return []

    summaries = []
    target_curr = (current_user.base_currency or "INR").upper()
    liquid_portfolio = await fire_service.get_liquid_assets_portfolio(current_user, db)

    for sc in scenarios:
        source_curr = (getattr(sc, "currency", None) or "INR").upper()
        if source_curr != target_curr:
            expenses = await fx_service.convert_amount(
                Decimal(str(sc.monthly_expenses_retirement)),
                source_curr,
                target_curr
            )
            contribution = await fx_service.convert_amount(
                Decimal(str(sc.monthly_contribution)),
                source_curr,
                target_curr
            )
            if sc.custom_liquid_override is not None and sc.custom_liquid_override > 0:
                lp = await fx_service.convert_amount(
                    Decimal(str(sc.custom_liquid_override)),
                    source_curr,
                    target_curr
                )
            else:
                lp = liquid_portfolio
        else:
            expenses = Decimal(str(sc.monthly_expenses_retirement))
            contribution = Decimal(str(sc.monthly_contribution))
            lp = sc.custom_liquid_override if (sc.custom_liquid_override is not None and sc.custom_liquid_override > 0) else liquid_portfolio

        metrics, _ = fire_service.calculate_metrics(
            dob=current_user.dob,
            monthly_expenses_retirement=expenses,
            retirement_age_goal=float(sc.retirement_age_goal),
            monthly_contribution=contribution,
            tax_rate_retirement=float(sc.tax_rate_retirement),
            swr=float(sc.swr),
            expected_annual_return=float(sc.expected_annual_return),
            inflation=float(sc.inflation),
            contribution_growth_rate=float(sc.contribution_growth_rate),
            current_liquid_portfolio=lp,
            base_currency=target_curr
        )
        summaries.append(
            FireScenarioSummary(
                id=sc.id,
                name=sc.name,
                description=sc.description,
                is_default=sc.is_default,
                currency=target_curr,
                retirement_age_goal=float(sc.retirement_age_goal),
                monthly_contribution=contribution,
                real_full_fi_target=metrics.real_full_fi_target,
                full_fi_age=metrics.full_fi_age,
                full_fi_timeline_variance=metrics.full_fi_timeline_variance,
                gap_vs_current=metrics.gap_vs_current,
                is_coast_fi_achieved=metrics.is_coast_fi_achieved,
                created_at=sc.created_at,
                updated_at=sc.updated_at
            )
        )

    return summaries


@router.post("/scenarios", response_model=FireScenarioResponse, status_code=status.HTTP_201_CREATED)
async def create_scenario(
    scenario_in: FireScenarioCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new FIRE scenario. If marked as default or is first scenario, ensures default exclusivity.
    """
    existing_res = await db.execute(select(FireScenario).where(FireScenario.user_id == current_user.id))
    has_existing = existing_res.scalars().first() is not None

    make_default = scenario_in.is_default or not has_existing

    if make_default:
        await db.execute(
            update(FireScenario)
            .where(FireScenario.user_id == current_user.id)
            .values(is_default=False)
        )

    new_sc = FireScenario(
        user_id=current_user.id,
        name=scenario_in.name,
        description=scenario_in.description,
        is_default=make_default,
        currency=(scenario_in.currency or current_user.base_currency or "INR").upper(),
        monthly_expenses_retirement=scenario_in.monthly_expenses_retirement,
        retirement_age_goal=Decimal(str(scenario_in.retirement_age_goal)),
        monthly_contribution=scenario_in.monthly_contribution,
        tax_rate_retirement=Decimal(str(scenario_in.tax_rate_retirement)),
        swr=Decimal(str(scenario_in.swr)),
        expected_annual_return=Decimal(str(scenario_in.expected_annual_return)),
        inflation=Decimal(str(scenario_in.inflation)),
        contribution_growth_rate=Decimal(str(scenario_in.contribution_growth_rate)),
        custom_liquid_override=scenario_in.custom_liquid_override
    )
    db.add(new_sc)
    await db.commit()
    await db.refresh(new_sc)

    return await _build_scenario_response(new_sc, current_user, db)


@router.get("/scenarios/{scenario_id}", response_model=FireScenarioResponse)
async def get_scenario(
    scenario_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves full details and calculations for a specific scenario.
    """
    result = await db.execute(
        select(FireScenario).where(
            (FireScenario.id == scenario_id) & (FireScenario.user_id == current_user.id)
        )
    )
    scenario = result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="FIRE Scenario not found")

    return await _build_scenario_response(scenario, current_user, db)


@router.put("/scenarios/{scenario_id}", response_model=FireScenarioResponse)
async def update_scenario(
    scenario_id: str,
    scenario_in: FireScenarioUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates an existing scenario.
    """
    result = await db.execute(
        select(FireScenario).where(
            (FireScenario.id == scenario_id) & (FireScenario.user_id == current_user.id)
        )
    )
    scenario = result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="FIRE Scenario not found")

    if scenario_in.currency is not None:
        scenario.currency = scenario_in.currency.upper()
    elif current_user.base_currency and (scenario_in.monthly_expenses_retirement is not None or scenario_in.monthly_contribution is not None):
        scenario.currency = current_user.base_currency.upper()

    if scenario_in.name is not None:
        scenario.name = scenario_in.name
    if scenario_in.description is not None:
        scenario.description = scenario_in.description
    if scenario_in.is_default is not None:
        if scenario_in.is_default:
            await db.execute(
                update(FireScenario)
                .where(FireScenario.user_id == current_user.id)
                .values(is_default=False)
            )
        scenario.is_default = scenario_in.is_default
    if scenario_in.monthly_expenses_retirement is not None:
        scenario.monthly_expenses_retirement = scenario_in.monthly_expenses_retirement
    if scenario_in.retirement_age_goal is not None:
        scenario.retirement_age_goal = Decimal(str(scenario_in.retirement_age_goal))
    if scenario_in.monthly_contribution is not None:
        scenario.monthly_contribution = scenario_in.monthly_contribution
    if scenario_in.tax_rate_retirement is not None:
        scenario.tax_rate_retirement = Decimal(str(scenario_in.tax_rate_retirement))
    if scenario_in.swr is not None:
        scenario.swr = Decimal(str(scenario_in.swr))
    if scenario_in.expected_annual_return is not None:
        scenario.expected_annual_return = Decimal(str(scenario_in.expected_annual_return))
    if scenario_in.inflation is not None:
        scenario.inflation = Decimal(str(scenario_in.inflation))
    if scenario_in.contribution_growth_rate is not None:
        scenario.contribution_growth_rate = Decimal(str(scenario_in.contribution_growth_rate))
    if scenario_in.custom_liquid_override is not None:
        scenario.custom_liquid_override = scenario_in.custom_liquid_override

    await db.commit()
    await db.refresh(scenario)

    return await _build_scenario_response(scenario, current_user, db)


@router.delete("/scenarios/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scenario(
    scenario_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes a scenario.
    """
    result = await db.execute(
        select(FireScenario).where(
            (FireScenario.id == scenario_id) & (FireScenario.user_id == current_user.id)
        )
    )
    scenario = result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="FIRE Scenario not found")

    was_default = scenario.is_default
    await db.delete(scenario)
    await db.commit()

    # If deleted scenario was default, pick another one to be default
    if was_default:
        remaining = await db.execute(
            select(FireScenario).where(FireScenario.user_id == current_user.id).order_by(FireScenario.created_at.asc())
        )
        first_rem = remaining.scalars().first()
        if first_rem:
            first_rem.is_default = True
            await db.commit()

    return None


@router.post("/scenarios/{scenario_id}/set-default", response_model=FireScenarioResponse)
async def set_default_scenario(
    scenario_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Marks a scenario as the default/primary one.
    """
    result = await db.execute(
        select(FireScenario).where(
            (FireScenario.id == scenario_id) & (FireScenario.user_id == current_user.id)
        )
    )
    scenario = result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="FIRE Scenario not found")

    await db.execute(
        update(FireScenario)
        .where(FireScenario.user_id == current_user.id)
        .values(is_default=False)
    )
    scenario.is_default = True
    await db.commit()
    await db.refresh(scenario)

    return await _build_scenario_response(scenario, current_user, db)


@router.post("/scenarios/compare", response_model=FireCompareResponse)
async def compare_scenarios(
    request: FireCompareRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Compares 1 to 5 scenarios side by side.
    """
    result = await db.execute(
        select(FireScenario).where(
            (FireScenario.id.in_(request.scenario_ids)) & (FireScenario.user_id == current_user.id)
        )
    )
    scenarios = result.scalars().all()
    if not scenarios:
        raise HTTPException(status_code=404, detail="None of the specified scenarios were found")

    responses = []
    for sc in scenarios:
        resp = await _build_scenario_response(sc, current_user, db)
        responses.append(resp)

    return FireCompareResponse(scenarios=responses)


@router.post("/calculate", response_model=FireScenarioResponse)
async def calculate_scratchpad(
    calc_in: FireCalculateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Stateless scratchpad simulation. Computes FIRE metrics and trajectory curves without saving to DB.
    """
    dob_to_use = calc_in.dob or current_user.dob

    if calc_in.custom_liquid_override is not None and calc_in.custom_liquid_override > Decimal("0.00"):
        liquid_assets = calc_in.custom_liquid_override
    else:
        liquid_assets = await fire_service.get_liquid_assets_portfolio(current_user, db)

    metrics, trajectory = fire_service.calculate_metrics(
        dob=dob_to_use,
        monthly_expenses_retirement=calc_in.monthly_expenses_retirement,
        retirement_age_goal=calc_in.retirement_age_goal,
        monthly_contribution=calc_in.monthly_contribution,
        tax_rate_retirement=calc_in.tax_rate_retirement,
        swr=calc_in.swr,
        expected_annual_return=calc_in.expected_annual_return,
        inflation=calc_in.inflation,
        contribution_growth_rate=calc_in.contribution_growth_rate,
        current_liquid_portfolio=liquid_assets,
        base_currency=current_user.base_currency or "INR"
    )

    now_utc = datetime.now(timezone.utc)
    return FireScenarioResponse(
        id="scratchpad",
        user_id=current_user.id,
        name="Scratchpad Simulation",
        description="Interactive what-if calculation",
        currency=current_user.base_currency or "INR",
        is_default=False,
        monthly_expenses_retirement=calc_in.monthly_expenses_retirement,
        retirement_age_goal=calc_in.retirement_age_goal,
        monthly_contribution=calc_in.monthly_contribution,
        tax_rate_retirement=calc_in.tax_rate_retirement,
        swr=calc_in.swr,
        expected_annual_return=calc_in.expected_annual_return,
        inflation=calc_in.inflation,
        contribution_growth_rate=calc_in.contribution_growth_rate,
        custom_liquid_override=calc_in.custom_liquid_override,
        created_at=now_utc,
        updated_at=now_utc,
        metrics=metrics,
        trajectory=trajectory
    )
