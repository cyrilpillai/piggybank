/**
 * Google Analytics 4 (GA4) Analytics Helper
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const GA_MEASUREMENT_ID =
  process.env.PUBLIC_GA_MEASUREMENT_ID ||
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Track page views
 */
export const trackPageView = (url: string) => {
  if (typeof window !== "undefined" && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

/**
 * Track custom events
 */
export const trackEvent = (
  action: string,
  params?: Record<string, string | number | boolean | undefined>
) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, params);
  }
};

/**
 * Convenience helper: Track user login
 */
export const trackLogin = (method: "google" | "dev") => {
  trackEvent("login", { method });
};

/**
 * Convenience helper: Track asset creation
 */
export const trackAddAsset = (category: string, currency: string) => {
  trackEvent("add_asset", {
    category,
    currency,
  });
};

/**
 * Convenience helper: Track liability creation
 */
export const trackAddLiability = (category: string, currency: string) => {
  trackEvent("add_liability", {
    category,
    currency,
  });
};

/**
 * Convenience helper: Track base currency change
 */
export const trackCurrencyChange = (newCurrency: string) => {
  trackEvent("change_currency", {
    currency: newCurrency,
  });
};
