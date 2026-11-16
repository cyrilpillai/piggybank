/**
 * Centralized UI string constants for Piggybank.
 * Ensures consistent terminology, messaging, and copy across the entire application.
 */

export const COPY = {
  APP: {
    NAME: "Piggybank",
    TAGLINE: "Personal Wealth OS",
    DESCRIPTION:
      "Track your global assets, liabilities, and multi-currency net worth seamlessly with Piggybank — the personal wealth OS.",
    AUTHOR: "Cyril Pillai",
  },

  NAV: {
    OVERVIEW: "Overview",
    ASSETS: "Assets Ledger",
    LIABILITIES: "Liabilities",
    FIRE: "FIRE Planner",
    QUICK_ADD_ARIA: "Add to Piggybank",
  },

  NET_WORTH: {
    TOTAL_NET_WORTH: "Total Net Worth",
    LIABILITY_RATIO: "Liability Ratio",
    ASSETS_COUNT: "Assets",
    LIABILITIES_COUNT: "Liabilities",
    ADD_ASSET: "Add Asset",
    ADD_LIABILITY: "Add Liability",
    TOTAL_ASSETS: "Total Assets",
    TOTAL_LIABILITIES: "Total Liabilities",
  },

  QUICK_ADD: {
    TITLE: "Quick Add Entry",
    DESCRIPTION:
      "Select whether you want to log a new asset or an outstanding liability.",
    ADD_ASSET: "Add Asset",
    ADD_LIABILITY: "Add Liability",
  },

  ASSETS: {
    PAGE_TITLE: "Assets Ledger",
    PAGE_DESC:
      "Track cash, investments, real estate, and digital assets with live conversion.",
    ADD_NEW: "Add New Asset",
    SEARCH_PLACEHOLDER: "Search assets by name, institution, notes...",
    SHOWING: "Showing",
    OF: "of",
    LABEL_PLURAL: "assets",
    FILTERED_TOTAL: "Filtered Balance:",
    TABLE_HEADER_NAME: "Asset / Holding",
    TABLE_HEADER_CATEGORY: "Category",
    TABLE_HEADER_INSTITUTION: "Institution",
    TABLE_HEADER_AMOUNT: "Balance",
    EMPTY_TITLE: "No assets recorded yet",
    EMPTY_DESC:
      "Add your bank accounts, stocks, real estate, or retirement funds to start building your net worth portfolio.",
    EMPTY_SEARCH_TITLE: "No assets match your filters",
    EMPTY_SEARCH_DESC:
      "Try adjusting your search query, switching categories, or resetting active filters.",
    RESET_FILTERS: "Reset all filters",
    MODAL_TITLE_ADD: "Add New Asset",
    MODAL_TITLE_EDIT: "Edit Asset",
    MODAL_DESC:
      "Track investments, cash, real estate, and holdings across global currencies",
    SAVE_BUTTON: "Save Asset",
    UPDATE_BUTTON: "Update Asset",
    SAVING_BUTTON: "Saving to Piggybank...",
    DELETE_TITLE: "Delete Asset",
    DELETE_DESC:
      "Are you sure you want to remove this asset? This action cannot be undone.",
    VALIDATION_NAME: "Please enter an asset name.",
    VALIDATION_AMOUNT: "Please enter a valid positive amount.",
  },

  LIABILITIES: {
    PAGE_TITLE: "Liabilities",
    PAGE_DESC:
      "Track mortgages, automobile loans, student loans, and revolving credit cards.",
    ADD_NEW: "Add New Liability",
    SEARCH_PLACEHOLDER: "Search liabilities by name, lender, notes...",
    SHOWING: "Showing",
    OF: "of",
    LABEL_PLURAL: "liabilities",
    FILTERED_TOTAL: "Filtered Balance:",
    TABLE_HEADER_NAME: "Liability",
    TABLE_HEADER_CATEGORY: "Category",
    TABLE_HEADER_LENDER: "Lender",
    TABLE_HEADER_INTEREST: "Interest",
    TABLE_HEADER_AMOUNT: "Balance",
    EMPTY_TITLE: "Zero Liabilities? Piggy is Dancing! 🎉",
    EMPTY_DESC:
      "If you have mortgages, personal loans, car loans, or credit cards, add them here to keep your net worth calculations honest.",
    EMPTY_SEARCH_TITLE: "No liabilities match your filters",
    EMPTY_SEARCH_DESC:
      "Try adjusting your search query, switching categories, or resetting active filters.",
    RESET_FILTERS: "Reset all filters",
    MODAL_TITLE_ADD: "Add New Liability",
    MODAL_TITLE_EDIT: "Edit Liability",
    MODAL_DESC: "Track loans, mortgages, and credit balances across currencies",
    SAVE_BUTTON: "Save Liability",
    UPDATE_BUTTON: "Update Liability",
    SAVING_BUTTON: "Saving to Piggybank...",
    DELETE_TITLE: "Delete Liability",
    DELETE_DESC:
      "Are you sure you want to remove this liability? This action cannot be undone.",
    VALIDATION_NAME: "Please enter a liability name.",
    VALIDATION_AMOUNT: "Please enter a valid positive liability amount.",
  },

  CATEGORIES: {
    ASSET_TITLE: "Asset Allocation",
    LIABILITY_TITLE: "Liabilities Breakdown",
    EMPTY_ASSETS_TITLE: "No assets added yet.",
    EMPTY_ASSETS_DESC:
      "Add your first holdings (e.g. Demat, bank savings) to see the category breakdown.",
    EMPTY_LIABILITIES_TITLE: "No liabilities added yet.",
    EMPTY_LIABILITIES_DESC:
      "Add your first liability (e.g. mortgage, car loan) to see the category breakdown.",
    ADD_ASSET_BTN: "+ Add Asset",
    ADD_LIABILITY_BTN: "+ Add Liability",
  },

  FIRE: {
    PRIMARY_TRAJECTORY: "Primary FIRE Trajectory",
    PRIMARY_PLAN: "Primary Plan",
    ACTIVE_SCENARIO: "Active Scenario:",
    FULL_FI_TARGET: "Full FI Target",
    COAST_FI_MILESTONE: "Coast FIRE Milestone",
    MONTHLY_SAVINGS_PACE: "Monthly Savings Pace",
    MONTHLY_SAVINGS_PLAN: "Monthly Savings Plan",
    TIMELINE_VARIANCE: "Timeline Variance",
    CURRENT_LIQUID_PORTFOLIO: "Current Liquid Portfolio",
    FULL_FI_CORPUS: "Full FI Corpus",
    COAST_FI_PROGRESS: "Coast FI Progress",
    COAST_FI_ACHIEVED: "Coast FI Achieved 🎉",
    TARGET: "Target",
    PROGRESS: "Progress:",
    GAP: "Gap:",
    REAL_TARGET_LABEL: "(Real Target)",
    NOMINAL_TARGET_LABEL: "Nominal Target",
    COAST_TARGET_DESC: "Capital needed today to coast to retirement",
    SURPLUS_PREFIX: "Surplus: +",
    SHORTFALL_PREFIX: "Shortfall: -",
    PER_MONTH_SUFFIX: "/mo",
    NEED_HIGHER_SAVINGS: "Need higher savings rate",
    ON_TRACK: "Right on track",
    AHEAD_SUFFIX: "ahead of goal",
    BEHIND_SUFFIX: "behind goal",
    DOB_BANNER_TITLE: "Date of Birth Required for Accurate Horizon",
    DOB_BANNER_DESC:
      "Calculates your exact current age, compounding years, and milestone dates.",
    SET_DOB: "Set Date of Birth",
    DOB_LABEL: "DOB",
    NEW_SCENARIO: "New Scenario",
    COMPARE_PLANS: "Compare Plans",
    DELETE_SCENARIO: "Delete Scenario",
    COMPARE_TITLE: "Compare FIRE Scenarios",
    COMPARE_DESC:
      "Select 2 to 4 scenarios to evaluate timelines and targets side by side",
    NEW_SCENARIO_TITLE: "Create New FIRE Scenario",
    NEW_SCENARIO_DESC:
      "Model an alternate financial independence strategy with custom assumptions",
    EMPTY_TITLE: "Configure Your First FIRE Strategy",
    EMPTY_DESC:
      "Model target retirement age, safe withdrawal rate, monthly savings rate, and compounding trajectory.",
    EMPTY_BTN: "Create First Scenario",
  },

  COMMON: {
    CANCEL: "Cancel",
    SAVE: "Save",
    DELETE: "Delete",
    CONFIRM: "Confirm",
    CLOSE: "Close",
    BACK: "Back",
    SORT: "Sort:",
    SAVING: "Saving...",
    SEARCH: "Search...",
  },
} as const;
