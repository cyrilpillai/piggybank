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
 * Standard grouping format according to currency standards.
 * E.g. 5000000 INR -> "50,00,000.00"
 * E.g. 5000000 USD -> "5,000,000.00"
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

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(num);
}

/**
 * Readable compact currency formatting for overview hero cards and metric summaries.
 * E.g. when base is INR:
 *   14,553,195.50 -> "1.46 Cr"
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
      const formatted = cr >= 100 ? cr.toFixed(1) : cr.toFixed(2);
      return { compact: `${sign}${parseFloat(formatted)} Cr`, full };
    }
    // 1 Lakh = 100,000 (10^5)
    if (abs >= 1e5) {
      const l = abs / 1e5;
      const formatted = l >= 100 ? l.toFixed(1) : l.toFixed(2);
      return { compact: `${sign}${parseFloat(formatted)} L`, full };
    }
    // Thousands
    if (abs >= 1e4) {
      const k = abs / 1e3;
      return { compact: `${sign}${parseFloat(k.toFixed(1))} K`, full };
    }
    return { compact: full, full };
  }

  // Western currencies (USD, EUR, GBP, CAD, etc.)
  if (abs >= 1e9) {
    const b = abs / 1e9;
    return { compact: `${sign}${parseFloat(b.toFixed(2))} B`, full };
  }
  if (abs >= 1e6) {
    const m = abs / 1e6;
    return { compact: `${sign}${parseFloat(m.toFixed(2))} M`, full };
  }
  if (abs >= 1e4) {
    const k = abs / 1e3;
    return { compact: `${sign}${parseFloat(k.toFixed(1))} K`, full };
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
