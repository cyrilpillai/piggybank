"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { trackLogin } from "@/lib/analytics";
import { User } from "@/types";
import { PiggyLogo } from "@/components/ui/PiggyLogo";
import { COPY } from "@/constants/copy";
import {
  ArrowRight,
  Globe,
  TrendingUp,
  ShieldCheck,
  Lock,
  Sparkles,
  Loader2,
  AlertCircle,
  Zap,
  CheckCircle2,
} from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              width?: number | string;
              text?: string;
              shape?: "rectangular" | "pill" | "circle";
            }
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState("john.doe@example.com");
  const [customName, setCustomName] = useState("John Doe");
  const [showCustomDev, setShowCustomDev] = useState(false);

  const googleClientId = process.env.PUBLIC_GOOGLE_CLIENT_ID;
  const isDevLoginEnabled =
    process.env.PUBLIC_ENABLE_DEV_LOGIN !== undefined
      ? process.env.PUBLIC_ENABLE_DEV_LOGIN === "true"
      : process.env.NODE_ENV === "development";

  const showDevOptions = isDevLoginEnabled;

  // Initialize Google Sign-In SDK if configured
  useEffect(() => {
    if (!googleClientId || googleClientId.includes("your-google-client-id")) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential: string }) => {
            try {
              setIsLoading(true);
              setError(null);
              const data = await api.loginWithGoogle(response.credential);
              trackLogin("google");
              onLoginSuccess(data.user);
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : "Google sign-in failed";
              setError(message);
            } finally {
              setIsLoading(false);
            }
          },
        });

        const googleBtnParent = document.getElementById("google-signin-btn");
        if (googleBtnParent) {
          window.google.accounts.id.renderButton(googleBtnParent, {
            theme: "filled_black",
            size: "large",
            width: "100%",
            shape: "pill",
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [googleClientId, onLoginSuccess]);

  const handleDevLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isDevLoginEnabled) {
      setError("Developer login is only available in development environment.");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.devLogin(customEmail.trim(), customName.trim());
      trackLogin("dev");
      onLoginSuccess(data.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Developer login failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white overflow-x-hidden">
      {/* Liquid Ambient Light Orbs */}
      <div className="liquid-mesh-container">
        <div className="liquid-orb-piggy animate-float-slow" />
        <div className="liquid-orb-teal animate-float-reverse" />
        <div className="liquid-orb-indigo animate-pulse-subtle" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 ios-icon-box ios-icon-box-pink">
            <PiggyLogo className="h-6 w-6 stroke-[2.4] text-pink-400" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white block">
              {COPY.AUTH.APP_NAME}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-pink-400">
              {COPY.AUTH.APP_TAGLINE}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area: 2-Column Responsive Layout */}
      <main className="relative z-10 flex-1 flex items-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* Left Column: Product Showcase & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/25 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-pink-400" />
              <span className="text-xs font-semibold tracking-wide text-pink-300">
                {COPY.AUTH.PILL_BADGE}
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.12]">
                {COPY.AUTH.HERO_TITLE_PREFIX}{" "}
                <span className="block bg-gradient-to-r from-pink-400 via-rose-300 to-teal-300 bg-clip-text text-transparent">
                  {COPY.AUTH.HERO_TITLE_GRADIENT}
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                {COPY.AUTH.HERO_DESC}
              </p>
            </div>

            {/* Portfolio Preview Glass Card */}
            <div className="rounded-3xl ios-glass-card p-5 sm:p-6 shadow-ios-card space-y-4 border border-white/15 relative overflow-hidden">
              {/* Subtle accent highlight */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    {COPY.AUTH.PORTFOLIO_DEMO_TITLE}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  +14.8% YoY
                </div>
              </div>

              {/* Net Worth Big Number */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block mb-0.5">
                    {COPY.AUTH.NORMALIZED_NET_WORTH}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    $148,250.00
                  </div>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span>Base:</span>
                  <span className="font-bold text-slate-200 bg-white/10 px-2 py-0.5 rounded-md">USD ($)</span>
                </div>
              </div>

              {/* Progress bar split */}
              <div className="space-y-1.5 pt-1">
                <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden flex gap-1 p-0.5">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 w-[81%]" title="Assets: 81%" />
                  <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-500 w-[19%]" title="Liabilities: 19%" />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-teal-400" />
                    <span className="text-slate-400 text-[11px]">Assets:</span>
                    <span className="font-bold text-slate-200 text-[11px]">$185,000.00</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    <span className="text-slate-400 text-[11px]">Liabilities:</span>
                    <span className="font-bold text-slate-200 text-[11px]">$36,750.00</span>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      DTI 19.8%
                    </span>
                  </div>
                </div>
              </div>

              {/* FX ticker chips */}
              <div className="pt-2 border-t border-white/[0.08] flex items-center gap-2 overflow-x-auto text-[11px] text-slate-400 no-scrollbar">
                <span className="text-[10px] font-bold text-slate-500 shrink-0">FX RATES:</span>
                <span className="shrink-0 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-slate-300">
                  1 USD = <span className="text-white font-semibold">84.42 INR</span>
                </span>
                <span className="shrink-0 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-slate-300">
                  1 EUR = <span className="text-white font-semibold">1.08 USD</span>
                </span>
                <span className="shrink-0 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-slate-300">
                  1 AED = <span className="text-white font-semibold">0.27 USD</span>
                </span>
                <span className="shrink-0 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-slate-300">
                  1 GBP = <span className="text-white font-semibold">1.28 USD</span>
                </span>
              </div>
            </div>

            {/* 3 Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl ios-glass border border-white/10 space-y-1.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="text-xs font-bold text-white">{COPY.AUTH.MULTI_CURRENCY_TITLE}</div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {COPY.AUTH.MULTI_CURRENCY_DESC}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl ios-glass border border-white/10 space-y-1.5">
                <div className="h-8 w-8 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-1">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-xs font-bold text-white">{COPY.AUTH.LEDGER_TITLE}</div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {COPY.AUTH.LEDGER_DESC}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl ios-glass border border-white/10 space-y-1.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-1">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="text-xs font-bold text-white">{COPY.AUTH.PRIVACY_TITLE}</div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {COPY.AUTH.PRIVACY_DESC}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Focused, High-End Sign-In Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="rounded-[32px] ios-glass-card p-6 sm:p-8 shadow-ios-card border border-white/15 relative overflow-hidden space-y-6">
              
              {/* Card Header */}
              <div className="text-center space-y-2">
                <div className="h-14 w-14 rounded-2xl ios-icon-box ios-icon-box-pink mb-1">
                  <PiggyLogo className="h-7 w-7 stroke-[2.4] text-pink-400" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {COPY.AUTH.WELCOME_TITLE}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  {COPY.AUTH.WELCOME_SUBTITLE}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs shadow-sm animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Main Sign In Action: Google OAuth Container */}
              <div className="space-y-3">
                <div id="google-signin-btn" className="flex justify-center min-h-[46px] w-full">
                  {/* High quality fallback button if Google SDK is unconfigured or blocked */}
                  <button
                    type="button"
                    onClick={() => {
                      setError(
                        isDevLoginEnabled
                          ? "Google OAuth Client ID is not configured in .env. Use 1-Click Dev Login below."
                          : "Google OAuth is not configured. Please verify client ID configuration."
                      );
                    }}
                    className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] text-white text-sm font-semibold border border-white/15 border-t-white/35 backdrop-blur-2xl shadow-sm hover:shadow-glass-sm transition-all duration-200 active:scale-[0.98]"
                  >
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{COPY.AUTH.CONTINUE_WITH_GOOGLE}</span>
                  </button>
                </div>

                <p className="text-[11px] text-center text-slate-400">
                  {COPY.AUTH.GOOGLE_INSTANT_NOTE}
                </p>
              </div>

              {/* Developer Sandbox Section (Visible in development, hidden when simulating prod) */}
              {showDevOptions && (
                <div className="pt-4 border-t border-white/[0.08] space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      {COPY.AUTH.DEV_SANDBOX_TITLE}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDevLogin()}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl ios-btn-primary shadow-glass-glow ring-1 ring-white/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 text-xs sm:text-sm font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{COPY.AUTH.DEV_CONNECTING}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 fill-white stroke-[2.2]" />
                        <span>{COPY.AUTH.DEV_LOGIN_BTN}</span>
                        <ArrowRight className="h-4 w-4 ml-auto text-white stroke-[2.5]" />
                      </>
                    )}
                  </button>

                  {/* Collapsible custom Dev profile switcher */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCustomDev(!showCustomDev)}
                      className="text-xs text-slate-400 hover:text-slate-200 font-semibold flex items-center justify-between w-full transition"
                    >
                      <span>{COPY.AUTH.CUSTOM_IDENTITY}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                        {showCustomDev ? "Hide" : "Customize"}
                      </span>
                    </button>

                    {showCustomDev && (
                      <form onSubmit={handleDevLogin} className="mt-3 space-y-3 pt-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            {COPY.AUTH.DISPLAY_NAME}
                          </label>
                          <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl ios-glass-input text-xs text-white placeholder-slate-400 focus:outline-none"
                            placeholder="e.g. John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            {COPY.AUTH.EMAIL_ADDRESS}
                          </label>
                          <input
                            type="email"
                            value={customEmail}
                            onChange={(e) => setCustomEmail(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl ios-glass-input text-xs text-white placeholder-slate-400 focus:outline-none"
                            placeholder="user@example.com"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-2.5 px-3 rounded-xl ios-glass-pill hover:bg-white/15 text-xs font-bold text-slate-100 transition"
                        >
                          {COPY.AUTH.CUSTOM_ENTER}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Trust & Security Highlights (Always present, ensuring card looks full & reassuring in prod) */}
              <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{COPY.AUTH.ENCRYPTION_NOTE}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <Lock className="h-4 w-4 text-teal-400 shrink-0" />
                  <span>{COPY.AUTH.NO_CREDENTIAL_NOTE}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>{COPY.AUTH.FREE_TO_USE}</span>
                </div>
              </div>

              {/* Footer legal text */}
              <p className="text-[10px] text-center text-slate-500 pt-2 border-t border-white/[0.05] leading-relaxed">
                {COPY.AUTH.LEGAL_NOTE}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Subtle Bottom Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-2">
          <PiggyLogo className="h-4 w-4 text-pink-400" />
          <span>{COPY.AUTH.FOOTER_TEXT}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>{COPY.AUTH.FOOTER_NORMALIZATION}</span>
          <span>•</span>
          <span>{COPY.AUTH.FOOTER_RATIOS}</span>
        </div>
      </footer>
    </div>
  );
};
