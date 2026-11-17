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

import { CurrencyItem } from "@/types";

const CURRENCY_STORAGE_KEY = "piggybank_supported_currencies";

// In-memory currency registry populated from backend (/currencies/supported)
let _currencySymbolMap: Record<string, string> = {};
let _currencyList: CurrencyItem[] = [];

// Hydrate from localStorage on client startup if available
if (typeof window !== "undefined") {
  try {
    const cached = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (cached) {
      const parsed: CurrencyItem[] = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        _currencyList = parsed;
        _currencySymbolMap = Object.fromEntries(
          parsed.map((c) => [c.code.toUpperCase(), c.symbol])
        );
      }
    }
  } catch {
    // Ignore storage read errors
  }
}

/**
 * Registers backend-supplied currencies into the centralized frontend registry.
 * Saves to localStorage for immediate hydration across sessions and slider use cases.
 */
export function registerSupportedCurrencies(currencies: CurrencyItem[]): void {
  if (!currencies || !Array.isArray(currencies)) return;
  _currencyList = currencies;
  _currencySymbolMap = Object.fromEntries(
    currencies.map((c) => [c.code.toUpperCase(), c.symbol])
  );
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(currencies));
    } catch {
      // Ignore storage write errors
    }
  }
}

/**
 * Returns the currently registered currencies loaded from backend.
 */
export function getRegisteredCurrencies(): CurrencyItem[] {
  return _currencyList;
}

/**
 * Returns the localized display symbol for a currency code (loaded from BE).
 * Falls back to the currency code itself if not registered.
 */
export function getCurrencySymbol(currencyCode: string): string {
  const code = (currencyCode || "INR").toUpperCase();
  return _currencySymbolMap[code] || code;
}

/**
 * Readable compact currency formatting for overview hero cards and metric summaries.
 * Always rounds down (floors) instead of rounding up.
 * E.g. when base is INR:
 *   38,568,871.90 -> "3.85Cr" (not 3.86Cr)
 *   14,553,195.50 -> "1.45Cr"
 *   5,000,000 -> "50L"
 *   865,000 -> "8.65L"
 *   45,000 -> "45K"
 *   5,000 -> "5K"
 * E.g. when base is USD:
 *   14,553,195.50 -> "14.55M"
 *   2,500,000 -> "2.5M"
 *   45,000 -> "45K"
 *   5,000 -> "5K"
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
      return { compact: `${sign}${parseFloat(formatted)}Cr`, full };
    }
    // 1 Lakh = 100,000 (10^5)
    if (abs >= 1e5) {
      const l = abs / 1e5;
      const formatted = l >= 100 ? floorToDecimals(l, 1) : floorToDecimals(l, 2);
      return { compact: `${sign}${parseFloat(formatted)}L`, full };
    }
    // Thousands (1,000 to 99,999)
    if (abs >= 1e3) {
      const k = abs / 1e3;
      const formatted = k >= 100 ? floorToDecimals(k, 1) : floorToDecimals(k, 2);
      return { compact: `${sign}${parseFloat(formatted)}K`, full };
    }
    // Under 1,000
    const underK = floorToDecimals(abs, 2);
    const cleanUnderK = underK.endsWith(".00") ? underK.slice(0, -3) : underK;
    return { compact: `${sign}${cleanUnderK}`, full };
  }

  // Western currencies (USD, EUR, GBP, CAD, etc.)
  if (abs >= 1e9) {
    const b = abs / 1e9;
    const formatted = b >= 100 ? floorToDecimals(b, 1) : floorToDecimals(b, 2);
    return { compact: `${sign}${parseFloat(formatted)}B`, full };
  }
  if (abs >= 1e6) {
    const m = abs / 1e6;
    const formatted = m >= 100 ? floorToDecimals(m, 1) : floorToDecimals(m, 2);
    return { compact: `${sign}${parseFloat(formatted)}M`, full };
  }
  if (abs >= 1e3) {
    const k = abs / 1e3;
    const formatted = k >= 100 ? floorToDecimals(k, 1) : floorToDecimals(k, 2);
    return { compact: `${sign}${parseFloat(formatted)}K`, full };
  }

  const underK = floorToDecimals(abs, 2);
  const cleanUnderK = underK.endsWith(".00") ? underK.slice(0, -3) : underK;
  return { compact: `${sign}${cleanUnderK}`, full };
}

/**
 * Prettifies an amount with currency symbol and compact units (e.g. ₹20L, ₹5K, $1.44M).
 */
export function formatCompactWithSymbol(
  amount: number | string,
  currencyCode = "INR"
): string {
  const code = (currencyCode || "INR").toUpperCase();
  const symbol = getCurrencySymbol(code);
  const compact = formatCompactCurrency(amount, code).compact;
  return `${symbol}${compact}`;
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

/**
 * Interface representing any generic split item (for donut charts, progress bars, legends).
 */
export interface GenericSplitItem {
  label: string;
  value: number | string;
  percentage?: number;
  count?: number;
  color?: string;
  dotColor?: string;
  textColor?: string;
  formattedValue?: string;
  [key: string]: any;
}

/**
 * Options for clamping split collections to top N items.
 */
export interface ClampSplitsOptions {
  othersLabel?: string;
  othersColor?: string;
  othersDotColor?: string;
  othersTextColor?: string;
  formatValue?: (val: number) => string;
}

/**
 * Clamps a list of split items (for donut charts, segmented progress bars, etc.)
 * to a maximum number of splits (default 10: top 9 + 1 consolidated "Others" section).
 * Everything beyond the top (maxSplits - 1) items is clubbed into "Others".
 */
export function clampToTopSplits<T extends GenericSplitItem>(
  items: T[],
  maxSplits = 10,
  options?: ClampSplitsOptions
): T[] {
  if (!items || items.length <= maxSplits) return items || [];

  const othersLabel = options?.othersLabel || "Others";
  const othersColor = options?.othersColor || "#64748b";
  const othersDotColor = options?.othersDotColor || "bg-slate-500";
  const othersTextColor = options?.othersTextColor || "text-slate-400";

  // Sort descending by value
  const sorted = [...items].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
  const top = sorted.slice(0, maxSplits - 1);
  const remaining = sorted.slice(maxSplits - 1);

  const othersValue = remaining.reduce(
    (sum, item) => sum + Math.max(0, Number(item.value) || 0),
    0
  );
  const othersPercentage = remaining.reduce(
    (sum, item) => sum + Math.max(0, Number(item.percentage) || 0),
    0
  );
  const othersCount = remaining.reduce(
    (sum, item) => sum + (item.count !== undefined ? Number(item.count) || 1 : 1),
    0
  );

  const othersFormattedValue = options?.formatValue
    ? options.formatValue(othersValue)
    : undefined;

  const othersItem = {
    ...remaining[0],
    label: othersLabel,
    value: othersValue,
    percentage: othersPercentage,
    count: othersCount,
    color: othersColor,
    dotColor: othersDotColor,
    textColor: othersTextColor,
    ...(othersFormattedValue ? { formattedValue: othersFormattedValue } : {}),
  } as T;

  return [...top, othersItem];
}


