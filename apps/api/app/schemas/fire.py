from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class FireScenarioBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Retirement at 50"])
    description: Optional[str] = Field(default=None, max_length=500)
    is_default: bool = Field(default=False)
    currency: str = Field(default="INR", max_length=10, examples=["INR", "USD"])
    monthly_expenses_retirement: Decimal = Field(..., gt=0, examples=[50000.0])
    retirement_age_goal: float = Field(..., gt=0, le=100, examples=[50.0])
    monthly_contribution: Decimal = Field(..., ge=0, examples=[25000.0])
    tax_rate_retirement: float = Field(..., ge=0.0, lt=1.0, examples=[0.15])
    swr: float = Field(..., gt=0.0, le=0.5, examples=[0.04])
    expected_annual_return: float = Field(..., ge=-0.9, le=1.0, examples=[0.10])
    inflation: float = Field(..., ge=-0.5, le=1.0, examples=[0.06])
    contribution_growth_rate: float = Field(default=0.0, ge=0.0, le=1.0, examples=[0.05])
    custom_liquid_override: Optional[Decimal] = Field(default=None, ge=0)


class FireScenarioCreate(FireScenarioBase):
    pass


class FireScenarioUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_default: Optional[bool] = None
    currency: Optional[str] = Field(default=None, max_length=10)
    monthly_expenses_retirement: Optional[Decimal] = Field(default=None, gt=0)
    retirement_age_goal: Optional[float] = Field(default=None, gt=0, le=100)
    monthly_contribution: Optional[Decimal] = Field(default=None, ge=0)
    tax_rate_retirement: Optional[float] = Field(default=None, ge=0.0, lt=1.0)
    swr: Optional[float] = Field(default=None, gt=0.0, le=0.5)
    expected_annual_return: Optional[float] = Field(default=None, ge=-0.9, le=1.0)
    inflation: Optional[float] = Field(default=None, ge=-0.5, le=1.0)
    contribution_growth_rate: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    custom_liquid_override: Optional[Decimal] = Field(default=None, ge=0)


class FireCalculateRequest(BaseModel):
    dob: Optional[date] = None
    monthly_expenses_retirement: Decimal = Field(..., gt=0, examples=[50000.0])
    retirement_age_goal: float = Field(..., gt=0, le=100, examples=[50.0])
    monthly_contribution: Decimal = Field(..., ge=0, examples=[25000.0])
    tax_rate_retirement: float = Field(..., ge=0.0, lt=1.0, examples=[0.15])
    swr: float = Field(..., gt=0.0, le=0.5, examples=[0.04])
    expected_annual_return: float = Field(..., ge=-0.9, le=1.0, examples=[0.10])
    inflation: float = Field(..., ge=-0.5, le=1.0, examples=[0.06])
    contribution_growth_rate: float = Field(default=0.0, ge=0.0, le=1.0, examples=[0.05])
    custom_liquid_override: Optional[Decimal] = None


class TrajectoryPoint(BaseModel):
    age: float
    year: int
    real_portfolio: Decimal
    nominal_portfolio: Decimal
    coast_fi_target: Decimal
    real_full_fi_target: Decimal


class FireCalculationMetrics(BaseModel):
    # Rates
    real_return_rate: float
    monthly_real_return_rate: float

    # Expenses
    annual_expenses_retirement: Decimal
    gross_annual_spending_needed: Decimal

    # Full FI Targets
    real_full_fi_target: Decimal
    nominal_full_fi_target: Decimal

    # Timeline & Contribution
    current_age: float
    years_to_goal_age: float
    full_fi_age: Optional[float] = None
    full_fi_year: Optional[int] = None
    full_fi_month: Optional[int] = None
    full_fi_timeline_variance: Optional[float] = None
    projected_portfolio_at_retirement: Decimal
    monthly_contribution_needed: Decimal
    gap_vs_current: Decimal
    is_full_fi_achieved_now: bool = False

    # Coast FI
    coast_fi_target: Decimal
    coast_fi_gap: Decimal
    coast_fi_age: Optional[float] = None
    coast_fi_year: Optional[int] = None
    coast_fi_month: Optional[int] = None
    coast_fi_timeline_variance: Optional[float] = None
    is_coast_fi_achieved: bool = False

    # Portfolio baseline
    current_liquid_portfolio: Decimal
    base_currency: str


class FireScenarioResponse(FireScenarioBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    metrics: FireCalculationMetrics
    trajectory: List[TrajectoryPoint] = []

    model_config = ConfigDict(from_attributes=True)


class FireScenarioSummary(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_default: bool
    currency: str = Field(default="INR")
    retirement_age_goal: float
    monthly_contribution: Decimal
    real_full_fi_target: Decimal
    full_fi_age: Optional[float] = None
    full_fi_year: Optional[int] = None
    full_fi_month: Optional[int] = None
    full_fi_timeline_variance: Optional[float] = None
    gap_vs_current: Decimal
    is_coast_fi_achieved: bool
    coast_fi_age: Optional[float] = None
    coast_fi_year: Optional[int] = None
    coast_fi_month: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class FireCompareRequest(BaseModel):
    scenario_ids: List[str] = Field(..., min_length=1, max_length=5)


class FireCompareResponse(BaseModel):
    scenarios: List[FireScenarioResponse]
