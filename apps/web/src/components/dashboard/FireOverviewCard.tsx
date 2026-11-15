"use client";

import React from "react";
import { FireScenario } from "@/types";
import { formatCompactCurrency } from "@/lib/format";
import {
  Flame,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Wallet,
} from "lucide-react";

interface FireOverviewCardProps {
  scenario: FireScenario | null;
  currencySymbol: string;
  baseCurrency?: string;
  onOpenFire: () => void;
}

export const FireOverviewCard: React.FC<FireOverviewCardProps> = ({
  scenario,
  currencySymbol,
  baseCurrency = "INR",
  onOpenFire,
}) => {
  // If no scenario is created yet, render an inviting onboarding / configuration prompt
  if (!scenario || !scenario.metrics) {
    return (
      <div className="relative overflow-hidden rounded-[32px] ios-glass-card p-6 sm:p-7 shadow-ios-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl ios-icon-box ios-icon-box-pink shrink-0 shadow-glass-glow flex items-center justify-center">
              <Flame className="h-6 w-6 text-pink-400 fill-pink-500/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Financial Independence & FIRE Planning
                </h3>
                <span className="ios-badge ios-badge-neutral text-[10px]">New</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                Calculate your projected Full FI timeline, track your real purchasing power target, and find out if your invested capital has already reached Coast FIRE status.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenFire}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl ios-btn-primary text-xs font-bold shadow-glass-glow shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Configure FIRE Plan</span>
            <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    );
  }

  const { metrics } = scenario;
  const currentLiquid = Number(metrics.current_liquid_portfolio) || 0;
  const fullFiTarget = Number(metrics.real_full_fi_target) || 0;
  const coastFiTarget = Number(metrics.coast_fi_target) || 0;

  // Percentage completed for Full FI
  const fiPercent =
    fullFiTarget > 0
      ? Math.min(100, Math.max(0, (currentLiquid / fullFiTarget) * 100))
      : 0;

  // Percentage completed for Coast FI
  const coastPercent =
    coastFiTarget > 0
      ? Math.min(100, Math.max(0, (currentLiquid / coastFiTarget) * 100))
      : 0;

  // Safe Withdrawal Rate percentage (stored as a fraction e.g. 0.03 = 3%)
  const swrPercent =
    Number(scenario.swr) <= 1 ? Number(scenario.swr) * 100 : Number(scenario.swr);
  const swrFormatted = Number.isInteger(swrPercent)
    ? swrPercent.toFixed(0)
    : swrPercent.toFixed(1);

  // Timeline variance
  const varianceNum = metrics.full_fi_timeline_variance;
  const isAhead = varianceNum !== null && varianceNum !== undefined && varianceNum >= 0;

  // Formatted compact numbers
  const currentLiquidFormatted = formatCompactCurrency(currentLiquid, baseCurrency);
  const fullFiFormatted = formatCompactCurrency(fullFiTarget, baseCurrency);
  const coastFiFormatted = formatCompactCurrency(coastFiTarget, baseCurrency);

  return (
    <div className="relative overflow-hidden rounded-[32px] ios-glass-card p-6 sm:p-8 shadow-ios-card space-y-6">
      {/* Ambient background glow accents */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl ios-icon-box ios-icon-box-pink shadow-glass-glow flex items-center justify-center">
            <Flame className="h-5 w-5 text-pink-400 fill-pink-500/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Primary FIRE Trajectory
              </h3>
              <span className="ios-badge ios-badge-pink text-[10px] font-semibold">
                {scenario.name}
              </span>
              {scenario.is_default && (
                <span className="hidden sm:inline-flex ios-badge ios-badge-neutral text-[10px]">
                  Default Plan
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Goal Retirement Age: <strong className="text-slate-200">{scenario.retirement_age_goal}</strong>
              {" • "}
              Current Age: <strong className="text-slate-200">{metrics.current_age}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onOpenFire}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white ios-glass-pill transition self-start sm:self-auto"
        >
          <span>Open Full Planner</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Primary Progress Bar: Full FI Milestone */}
      <div className="relative z-10 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Full FI Corpus Progress
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-pink-500/15 text-pink-300 border border-pink-500/25">
              {fiPercent.toFixed(1)}% Completed
            </span>
          </div>

          <div className="text-slate-400 text-xs">
            <span className="text-slate-300 font-semibold">
              {currencySymbol}{currentLiquidFormatted.compact}
            </span>
            {" of "}
            <strong className="text-white font-bold">
              {currencySymbol}{fullFiFormatted.compact}
            </strong>
            <span className="text-[11px] text-slate-500 hidden sm:inline"> (Real Target)</span>
          </div>
        </div>

        {/* Liquid Gradient Progress Track */}
        <div className="relative h-3.5 w-full rounded-full bg-black/40 p-0.5 overflow-hidden border border-white/10 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 shadow-[0_0_14px_rgba(244,114,182,0.6)] transition-all duration-700 ease-out"
            style={{ width: `${Math.max(2, fiPercent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span>Current Invested FIRE Capital</span>
          <span>Target at SWR {swrFormatted}%</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Metric 1: Projected Full FI Timeline */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Projected FI Timeline</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>

          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {metrics.full_fi_age !== null && metrics.full_fi_age !== undefined
                ? `Age ${metrics.full_fi_age}`
                : "Unattainable"}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {metrics.full_fi_year ? `Target Year: ${metrics.full_fi_year}` : "Adjust savings or return rate"}
            </p>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            {varianceNum !== null && varianceNum !== undefined ? (
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isAhead
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                    : "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                }`}
              >
                {isAhead ? (
                  <>
                    <Sparkles className="h-3 w-3" />
                    <span>+{Math.abs(varianceNum).toFixed(1)}y ahead of goal</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    <span>-{Math.abs(varianceNum).toFixed(1)}y behind goal</span>
                  </>
                )}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500">Need higher savings rate</span>
            )}
          </div>
        </div>

        {/* Metric 2: Primary FIRE Coast Milestone */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Coast FIRE Milestone</span>
            <ShieldCheck className="h-4 w-4 text-purple-400" />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white tracking-tight">
                {currencySymbol}{coastFiFormatted.compact}
              </span>
              <span className="text-xs text-slate-400">target</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Capital needed today to coast to retirement
            </p>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            {metrics.is_coast_fi_achieved ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm">
                <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                <span>Coast FI Achieved 🎉</span>
              </span>
            ) : (
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-medium">
                  Progress: <strong className="text-white">{coastPercent.toFixed(0)}%</strong>
                </span>
                <span className="text-amber-300 font-semibold">
                  Gap: {currencySymbol}{formatCompactCurrency(Math.abs(Number(metrics.coast_fi_gap)), baseCurrency).compact}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Metric 3: Monthly Savings Target & Contribution Pace */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Monthly Savings Pace</span>
            <Wallet className="h-4 w-4 text-emerald-400" />
          </div>

          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {currencySymbol}{formatCompactCurrency(Number(metrics.monthly_contribution_needed), baseCurrency).compact}
              <span className="text-xs text-slate-400 font-normal">/mo</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Required to hit goal at Age {scenario.retirement_age_goal}
            </p>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            {Number(metrics.gap_vs_current) >= 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                <Sparkles className="h-3 w-3" />
                <span>
                  Surplus: +{currencySymbol}{formatCompactCurrency(Number(metrics.gap_vs_current), baseCurrency).compact}/mo
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/25">
                <AlertCircle className="h-3 w-3" />
                <span>
                  Shortfall: -{currencySymbol}{formatCompactCurrency(Math.abs(Number(metrics.gap_vs_current)), baseCurrency).compact}/mo
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
