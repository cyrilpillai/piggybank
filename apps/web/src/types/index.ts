export interface User {
  id: str;
  email: string;
  name: string;
  dob?: string | null;
  avatar_url?: string | null;
  base_currency: string;
  created_at: string;
  updated_at: string;
}

export type str = string;

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  category: string;
  sub_category?: string | null;
  amount: number | string;
  currency: string;
  institution?: string | null;
  notes?: string | null;
  exclude_from_fire?: boolean;
  is_automated: boolean;
  external_source?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number | string;
  currency: string;
  interest_rate?: number | null;
  institution?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubCategoryBreakdown {
  sub_category: string;
  total_amount: number | string;
  percentage: number;
  count: number;
}

export interface CategoryBreakdown {
  category: string;
  total_amount: number | string;
  percentage: number;
  count: number;
  sub_categories?: SubCategoryBreakdown[];
}

export interface NetWorthSummary {
  base_currency: string;
  total_assets: number | string;
  total_liabilities: number | string;
  net_worth: number | string;
  debt_to_asset_ratio: number;
  asset_count: number;
  liability_count: number;
}

export interface DashboardResponse {
  summary: NetWorthSummary;
  asset_categories: CategoryBreakdown[];
  liability_categories: CategoryBreakdown[];
}

export type HistoryRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

export interface NetWorthHistoryPoint {
  date: string;
  net_worth: number | string;
  total_assets: number | string;
  total_liabilities: number | string;
}

export interface NetWorthHistoryResponse {
  currency: string;
  range: string;
  start_date: string;
  end_date: string;
  net_change: number | string;
  percentage_change: number;
  points: NetWorthHistoryPoint[];
}

export interface CurrencyItem {
  code: string;
  name: string;
  symbol: string;
}

// Categories and Subcategories Configuration
export const ASSET_CATEGORIES_MAP: Record<string, string[]> = {
  "Cash & Bank": ["Savings", "Current"],
  "Fixed Income": ["Fixed Deposit", "PPF", "EPF", "Debt Mutual Fund", "Debt ETFs"],
  "Equity": ["Direct Equity Stocks", "Equity Mutual Fund", "Equity ETFs"],
  "Commodities": ["Physical Gold", "Digital Gold", "Gold ETF", "Car"],
  "Real Estate": ["Residential", "Commercial", "REIT"],
};

export const ASSET_CATEGORIES = Object.keys(ASSET_CATEGORIES_MAP);

// Subcategories considered illiquid (physical property, vehicles, etc.)
export const ILLIQUID_SUB_CATEGORIES = new Set([
  "Car",
  "Residential",
  "Commercial",
]);

export const isSubCategoryLiquid = (subCategory?: string | null): boolean => {
  if (!subCategory) return true;
  return !ILLIQUID_SUB_CATEGORIES.has(subCategory);
};

export const LIABILITY_CATEGORIES = [
  "Home Loan",
  "Personal Loan",
  "Credit Card",
  "Education Loan",
  "Automobile Loan",
  "Business Loan",
  "Other Liabilities",
];

// --- FIRE Types ---
export interface TrajectoryPoint {
  age: number;
  year: number;
  real_portfolio: number | string;
  nominal_portfolio: number | string;
  coast_fi_target: number | string;
  real_full_fi_target: number | string;
}

export interface FireCalculationMetrics {
  real_return_rate: number;
  monthly_real_return_rate: number;
  annual_expenses_retirement: number | string;
  gross_annual_spending_needed: number | string;
  real_full_fi_target: number | string;
  nominal_full_fi_target: number | string;
  current_age: number;
  years_to_goal_age: number;
  full_fi_age?: number | null;
  full_fi_year?: number | null;
  full_fi_month?: number | null;
  full_fi_timeline_variance?: number | null;
  projected_portfolio_at_retirement: number | string;
  monthly_contribution_needed: number | string;
  gap_vs_current: number | string;
  is_full_fi_achieved_now: boolean;
  coast_fi_target: number | string;
  coast_fi_gap: number | string;
  coast_fi_age?: number | null;
  coast_fi_year?: number | null;
  coast_fi_month?: number | null;
  coast_fi_timeline_variance?: number | null;
  is_coast_fi_achieved: boolean;
  current_liquid_portfolio: number | string;
  base_currency: string;
}

export interface FireScenario {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  is_default: boolean;
  currency?: string;
  monthly_expenses_retirement: number | string;
  retirement_age_goal: number;
  monthly_contribution: number | string;
  tax_rate_retirement: number;
  swr: number;
  expected_annual_return: number;
  inflation: number;
  contribution_growth_rate: number;
  custom_liquid_override?: number | string | null;
  created_at: string;
  updated_at: string;
  metrics: FireCalculationMetrics;
  trajectory: TrajectoryPoint[];
}

export interface FireScenarioSummary {
  id: string;
  name: string;
  description?: string | null;
  is_default: boolean;
  currency?: string;
  retirement_age_goal: number;
  monthly_contribution: number | string;
  real_full_fi_target: number | string;
  full_fi_age?: number | null;
  full_fi_year?: number | null;
  full_fi_month?: number | null;
  full_fi_timeline_variance?: number | null;
  gap_vs_current: number | string;
  is_coast_fi_achieved: boolean;
  coast_fi_age?: number | null;
  coast_fi_year?: number | null;
  coast_fi_month?: number | null;
  created_at: string;
  updated_at: string;
}

export interface FireCalculateRequest {
  dob?: string | null;
  monthly_expenses_retirement: number;
  retirement_age_goal: number;
  monthly_contribution: number;
  tax_rate_retirement: number;
  swr: number;
  expected_annual_return: number;
  inflation: number;
  contribution_growth_rate: number;
  custom_liquid_override?: number | null;
}
