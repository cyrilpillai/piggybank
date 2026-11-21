"use client";

import React from "react";
import { FireCalculationMetrics } from "@/types";
import {
  formatCurrencyAmount,
  formatCompactCurrency,
  formatYearsVariance,
  formatMonthYear,
} from "@/lib/format";
import { COPY } from "@/constants/copy";
import { Target, Clock, Wallet, ShieldCheck, AlertCircle, Sparkles } from "lucide-react";

interface FireKpiCardsProps {
  metrics: FireCalculationMetrics;
  currencySymbol: string;
  baseCurrency?: string;
  goalAge: number;
}

export const FireKpiCards: React.FC<FireKpiCardsProps> = ({
  metrics,
  currencySymbol,
  baseCurrency = "INR",
  goalAge,
}) => {
  const formatCurrency = (val: number | string) => {
    const num = Number(val);
    if (isNaN(num)) return `${currencySymbol}0`;
    if (Math.abs(num) >= 1e4) {
      return `${currencySymbol}${formatCompactCurrency(num, baseCurrency).compact}`;
    }
    return `${currencySymbol}${formatCurrencyAmount(num, baseCurrency, 0)}`;
  };

  const gapNum = Number(metrics.gap_vs_current) || 0;
  const isSurplus = gapNum >= 0;
  const timeline = formatYearsVariance(metrics.full_fi_timeline_variance, goalAge);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Real & Nominal FI Target */}
      <div className="ios-kpi-card">
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Full FI Target</span>
            <Target className="h-4 w-4 text-pink-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatCurrency(metrics.real_full_fi_target)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">In today's real purchasing power</p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] space-y-1">
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400">Nominal Target:</span>
            <span className="font-semibold text-amber-300">
              {formatCurrency(metrics.nominal_full_fi_target)}
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400">Gross Spending/yr:</span>
            <span className="font-medium text-slate-200">
              {formatCurrency(metrics.gross_annual_spending_needed)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Full FI Age & Timeline Variance */}
      <div className="ios-kpi-card">
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Projected FI Age</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {metrics.full_fi_age !== null && metrics.full_fi_age !== undefined
              ? `Age ${metrics.full_fi_age}`
              : "Unattainable"}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.full_fi_year
              ? `Target: ${formatMonthYear(metrics.full_fi_year, metrics.full_fi_month)}`
              : "Adjust parameters"}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          {timeline.hasVariance ? (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                timeline.isAhead
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
              }`}
            >
              {timeline.isAhead ? (
                <Sparkles className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              <span>{timeline.text}</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-500">{timeline.text}</span>
          )}
        </div>
      </div>

      {/* 3. Monthly Contribution Gap */}
      <div className="ios-kpi-card">
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Needed</span>
            <Wallet className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatCurrency(metrics.monthly_contribution_needed)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Current: {formatCurrency(Number(metrics.monthly_contribution_needed) + gapNum)}/mo
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
              isSurplus
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
            }`}
          >
            {isSurplus ? (
              <span>Surplus: +{formatCurrency(gapNum)}/mo</span>
            ) : (
              <span>Shortfall: -{formatCurrency(Math.abs(gapNum))}/mo</span>
            )}
          </span>
        </div>
      </div>

      {/* 4. Coast FI Target & Gap */}
      <div className="ios-kpi-card">
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Coast FI Target</span>
            <ShieldCheck className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatCurrency(metrics.coast_fi_target)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.is_coast_fi_achieved
              ? `Coast FI Achieved • ${formatMonthYear(metrics.coast_fi_year, metrics.coast_fi_month)}`
              : metrics.coast_fi_year
              ? `Projected Coast: ${formatMonthYear(metrics.coast_fi_year, metrics.coast_fi_month)}${metrics.coast_fi_age ? ` (Age ${metrics.coast_fi_age})` : ""}`
              : `Invested FIRE Capital: ${formatCurrency(metrics.current_liquid_portfolio)}`}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          {metrics.is_coast_fi_achieved ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              <Sparkles className="h-3 w-3" />
              <span>Coast FI Achieved 🎉</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-white/10">
              <span>Gap: {formatCurrency(Math.abs(Number(metrics.coast_fi_gap)))}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
