/**
 * Currency locale mapping for standard international grouping.
 * E.g. INR uses 'en-IN' for thousands, lakhs, crores (50,00,000).
 * USD/CAD/AUD use 'en-US' for millions/billions (5,000,000).
 */
const CURRENCY_LOCALES: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "en-AE",
  SGD: "en-SG",
  CAD: "en-CA",
  AUD: "en-AU",
  JPY: "ja-JP",
  CHF: "de-CH",
};

/**
 * Floors/truncates a number to a specified number of decimal places (always rounds down).
 * E.g. floorToDecimals(3.85688719, 2) -> "3.85"
 * E.g. floorToDecimals(14.559, 2) -> "14.55"
 * Uses an epsilon of 1e-9 to prevent floating point inaccuracies.
 */
export function floorToDecimals(num: number, decimals: number): string {
  if (isNaN(num)) return (0).toFixed(decimals);
  const factor = Math.pow(10, decimals);
  const floored = Math.floor(Math.abs(num) * factor + 1e-9) / factor;
  return floored.toFixed(decimals);
}

/**
 * Standard grouping format according to currency standards.
 * E.g. 5000000 INR -> "50,00,000.00"
 * E.g. 5000000 USD -> "5,000,000.00"
 * Always rounds down to fractionDigits instead of rounding up.
 */
export function formatCurrencyAmount(
  amount: number | string,
  currencyCode = "INR",
  decimals = 2
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0.00";

  const code = (currencyCode || "INR").toUpperCase();
  const locale = CURRENCY_LOCALES[code] || "en-US";
  const fractionDigits = code === "JPY" ? 0 : decimals;

  const sign = num < 0 ? -1 : 1;
  const abs = Math.abs(num);
  const factor = Math.pow(10, fractionDigits);
  const flooredAbs = Math.floor(abs * factor + 1e-9) / factor;
  const flooredNum = sign * flooredAbs;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(flooredNum);
}

/**
 * Readable compact currency formatting for overview hero cards and metric summaries.
 * Always rounds down (floors) instead of rounding up.
 * E.g. when base is INR:
 *   38,568,871.90 -> "3.85 Cr" (not 3.86 Cr)
 *   14,553,195.50 -> "1.45 Cr"
 *   5,000,000 -> "50 L"
 *   865,000 -> "8.65 L"
 *   45,000 -> "45 K"
 * E.g. when base is USD:
 *   14,553,195.50 -> "14.55 M"
 *   2,500,000 -> "2.5 M"
 *   45,000 -> "45 K"
 */
export function formatCompactCurrency(
  amount: number | string,
  currencyCode = "INR"
): { compact: string; full: string } {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) {
    return { compact: "0.00", full: "0.00" };
  }

  const code = (currencyCode || "INR").toUpperCase();
  const isNegative = num < 0;
  const abs = Math.abs(num);
  const sign = isNegative ? "-" : "";
  const full = formatCurrencyAmount(num, code);

  if (code === "INR") {
    // 1 Crore = 10,000,000 (10^7)
    if (abs >= 1e7) {
      const cr = abs / 1e7;
      const formatted = cr >= 100 ? floorToDecimals(cr, 1) : floorToDecimals(cr, 2);
      return { compact: `${sign}${parseFloat(formatted)} Cr`, full };
    }
    // 1 Lakh = 100,000 (10^5)
    if (abs >= 1e5) {
      const l = abs / 1e5;
      const formatted = l >= 100 ? floorToDecimals(l, 1) : floorToDecimals(l, 2);
      return { compact: `${sign}${parseFloat(formatted)} L`, full };
    }
    // Thousands
    if (abs >= 1e4) {
      const k = abs / 1e3;
      return { compact: `${sign}${parseFloat(floorToDecimals(k, 1))} K`, full };
    }
    return { compact: full, full };
  }

  // Western currencies (USD, EUR, GBP, CAD, etc.)
  if (abs >= 1e9) {
    const b = abs / 1e9;
    return { compact: `${sign}${parseFloat(floorToDecimals(b, 2))} B`, full };
  }
  if (abs >= 1e6) {
    const m = abs / 1e6;
    return { compact: `${sign}${parseFloat(floorToDecimals(m, 2))} M`, full };
  }
  if (abs >= 1e4) {
    const k = abs / 1e3;
    return { compact: `${sign}${parseFloat(floorToDecimals(k, 1))} K`, full };
  }

  return { compact: full, full };
}

/**
 * Converts an amount from holding currency to base currency using exchange rates.
 */
export function convertToBaseCurrency(
  amount: number | string,
  fromCurrency: string,
  baseCurrency: string,
  rates: Record<string, number> = {}
): number {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) return 0;

  const from = (fromCurrency || baseCurrency).toUpperCase();
  const base = (baseCurrency || "INR").toUpperCase();
  if (from === base) return num;

  // Rate against base currency (i.e. 1 Base = X FromCurrency)
  const rate = rates[from];
  if (rate && rate > 0) {
    return num / rate;
  }

  // Fallback to static USD cross rates table if fetched rate is missing
  const STATIC_USD_RATES: Record<string, number> = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    INR: 86.5,
    AED: 3.6725,
    SGD: 1.34,
    CAD: 1.39,
    AUD: 1.54,
    JPY: 154.0,
    CHF: 0.89,
  };
  const fromInUSD = num / (STATIC_USD_RATES[from] || 1.0);
  const targetRate = STATIC_USD_RATES[base] || 1.0;
  return fromInUSD * targetRate;
}

/**
 * Formats an ISO Date of Birth string (YYYY-MM-DD) into DD-MM-YYYY format for display.
 * E.g. "1995-06-15" -> "15-06-1995"
 */
export function formatDob(dob: string | null | undefined): string {
  if (!dob) return "";
  const parts = dob.trim().split("-");
  if (parts.length === 3) {
    // If YYYY-MM-DD
    if (parts[0].length === 4) {
      return `${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[0]}`;
    }
    // If already DD-MM-YYYY
    if (parts[2].length === 4) {
      return `${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[2]}`;
    }
  }
  return dob;
}

/**
 * Formats a percentage value consistently across the product.
 * E.g. formatPercent(3.5, 1) -> "3.5%"
 * E.g. formatPercent(4, 0) -> "4%"
 * E.g. formatPercent(3.567, 2, { floor: true }) -> "3.56%"
 */
export function formatPercent(
  value: number | string,
  decimals = 1,
  options?: { floor?: boolean; trimZero?: boolean }
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0%";

  const formatted = options?.floor
    ? floorToDecimals(num, decimals)
    : num.toFixed(decimals);

  if (options?.trimZero && Number.isInteger(num)) {
    return `${parseInt(formatted, 10)}%`;
  }

  return `${formatted}%`;
}

/**
 * Formats a multiplier (e.g. 25x, 33.3x) consistently.
 */
export function formatMultiplier(multiple: number | string, decimals = 1): string {
  const num = typeof multiple === "string" ? parseFloat(multiple) : multiple;
  if (isNaN(num) || num <= 0) return "0x";
  const floored = floorToDecimals(num, decimals);
  return `${parseFloat(floored)}x`;
}

/**
 * Formats timeline variance in years relative to target retirement goal age.
 * E.g. +1.2y ahead of goal (55) / -0.5y behind goal (55) / Right on track (55)
 */
export function formatYearsVariance(
  variance: number | null | undefined,
  goalAge?: number
): { text: string; isAhead: boolean; isExact: boolean; hasVariance: boolean } {
  if (variance === null || variance === undefined) {
    return {
      text: "Need higher savings rate",
      isAhead: false,
      isExact: false,
      hasVariance: false,
    };
  }

  const ageSuffix = goalAge ? ` (${goalAge})` : "";
  const absYears = floorToDecimals(Math.abs(variance), 1);

  if (Math.abs(variance) < 0.05) {
    return {
      text: `Right on track${ageSuffix}`,
      isAhead: true,
      isExact: true,
      hasVariance: true,
    };
  }

  if (variance > 0) {
    return {
      text: `+${absYears}y ahead of goal${ageSuffix}`,
      isAhead: true,
      isExact: false,
      hasVariance: true,
    };
  }

  return {
    text: `-${absYears}y behind goal${ageSuffix}`,
    isAhead: false,
    isExact: false,
    hasVariance: true,
  };
}

/**
 * Formats age into standard text display.
 * E.g. formatAge(30) -> "30 yrs"
 */
export function formatAge(age: number | null | undefined): string {
  if (age === null || age === undefined || isNaN(age)) return "";
  return `${age} yrs`;
}

