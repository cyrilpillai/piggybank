"use client";

import React from "react";
import { FireCalculationMetrics } from "@/types";
import { formatCompactCurrency, formatPercent, formatMonthYear } from "@/lib/format";
import { COPY } from "@/constants/copy";
import { GlassProgressBar } from "@/components/ui/GlassProgressBar";
import { Flame, ShieldCheck, CheckCircle2 } from "lucide-react";

interface FireProgressCardsProps {
  metrics: FireCalculationMetrics;
  swr?: number | string;
  currencySymbol: string;
  baseCurrency?: string;
  goalAge?: number;
}

export const FireProgressCards: React.FC<FireProgressCardsProps> = ({
  metrics,
  swr,
  currencySymbol,
  baseCurrency = "INR",
  goalAge,
}) => {
  const currentLiquid = Number(metrics.current_liquid_portfolio) || 0;
  const fullFiTarget = Number(metrics.real_full_fi_target) || 0;
  const coastFiTarget = Number(metrics.coast_fi_target) || 0;

  // Percentage completed for Full FI
  const fiPercent =
    fullFiTarget > 0
      ? Math.min(100, Math.max(0, (currentLiquid / fullFiTarget) * 100))
      : 0;

  // Percentage completed for Coast FI
  const coastPercentRaw =
    coastFiTarget > 0 ? (currentLiquid / coastFiTarget) * 100 : 0;
  const coastPercent = Math.min(100, Math.max(0, coastPercentRaw));

  // Safe Withdrawal Rate percentage
  const swrNum = swr !== undefined ? Number(swr) : 4;
  const swrPercent = swrNum <= 1 ? swrNum * 100 : swrNum;
  const swrFormatted = formatPercent(swrPercent, 1, { trimZero: true });

  // Formatted compact values
  const currentLiquidFormatted = formatCompactCurrency(currentLiquid, baseCurrency);
  const fullFiFormatted = formatCompactCurrency(fullFiTarget, baseCurrency);
  const coastFiFormatted = formatCompactCurrency(coastFiTarget, baseCurrency);

  return (
    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      {/* 1. Full FI Corpus Progress */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md space-y-2.5 shadow-sm">
        {/* Header Row: Title & Percentage Badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0 shadow-glass-glow">
              <Flame className="h-3.5 w-3.5 text-pink-400 fill-pink-500/20" />
            </div>
            <span className="font-bold text-white uppercase tracking-wider text-xs truncate">
              {COPY.FIRE.FULL_FI_CORPUS}
            </span>
          </div>

          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold font-mono tracking-tight whitespace-nowrap bg-pink-500/10 text-pink-300 border border-pink-500/25 shadow-[0_0_12px_rgba(244,114,182,0.15)]">
            {formatPercent(fiPercent, 1)}
          </span>
        </div>

        {/* Liquid Gradient Progress Track */}
        <GlassProgressBar
          value={fiPercent}
          color="fire"
          size="md"
          ariaLabel={COPY.FIRE.FULL_FI_CORPUS}
        />

        {/* Value and Context Footer */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <div className="flex items-baseline gap-1 text-slate-400">
            <span className="text-white font-bold text-sm tracking-tight">
              {currencySymbol}{currentLiquidFormatted.compact}
            </span>
            <span className="text-[11px] text-slate-400">
              of <strong className="text-slate-200 font-semibold">{currencySymbol}{fullFiFormatted.compact}</strong>
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">(Real Target)</span>
          </div>

          <span className="text-[11px] text-slate-400 text-right">
            {metrics.full_fi_year ? (
              <>
                Target: <strong className="text-slate-200 font-medium">{formatMonthYear(metrics.full_fi_year, metrics.full_fi_month)}</strong>
              </>
            ) : (
              `Target at SWR ${swrFormatted}%`
            )}
          </span>
        </div>
      </div>

      {/* 2. Coast FI Milestone Progress */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md space-y-2.5 shadow-sm">
        {/* Header Row: Title & Percentage Badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-glass-glow">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <span className="font-bold text-white uppercase tracking-wider text-xs truncate">
              {COPY.FIRE.COAST_FI_PROGRESS}
            </span>
          </div>

          {metrics.is_coast_fi_achieved || coastPercentRaw >= 100 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>{COPY.FIRE.COAST_FI_ACHIEVED}</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold font-mono tracking-tight whitespace-nowrap bg-purple-500/10 text-purple-300 border border-purple-500/25 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
              {formatPercent(coastPercent, 1)}
            </span>
          )}
        </div>

        {/* Liquid Gradient Progress Track */}
        <GlassProgressBar
          value={coastPercent}
          color="coast"
          size="md"
          ariaLabel={COPY.FIRE.COAST_FI_PROGRESS}
        />

        {/* Value and Context Footer */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <div className="flex items-baseline gap-1 text-slate-400">
            <span className="text-white font-bold text-sm tracking-tight">
              {currencySymbol}{currentLiquidFormatted.compact}
            </span>
            <span className="text-[11px] text-slate-400">
              of <strong className="text-slate-200 font-semibold">{currencySymbol}{coastFiFormatted.compact}</strong>
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">(Coast Target)</span>
          </div>

          <span className="text-[11px] text-slate-400 text-right">
            {metrics.is_coast_fi_achieved ? (
              <span className="text-cyan-300 font-medium">Coast FI Achieved</span>
            ) : metrics.coast_fi_year ? (
              <>
                Projected: <strong className="text-slate-200 font-medium">{formatMonthYear(metrics.coast_fi_year, metrics.coast_fi_month)}</strong>
              </>
            ) : goalAge ? (
              `Needed to Coast to Age ${goalAge}`
            ) : (
              "Needed to Coast"
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
