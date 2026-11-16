"use client";

import React from "react";
import { NetWorthSummary } from "@/types";
import { TrendingUp, TrendingDown, ShieldCheck, Plus, Sparkles } from "lucide-react";
import { formatCompactCurrency, formatPercent } from "@/lib/format";
import { COPY } from "@/constants/copy";

interface NetWorthCardProps {
  summary: NetWorthSummary;
  currencySymbol: string;
  onAddAsset: () => void;
  onAddLiability: () => void;
}

export const NetWorthCard: React.FC<NetWorthCardProps> = ({
  summary,
  currencySymbol,
  onAddAsset,
  onAddLiability,
}) => {
  const netWorthNum = Number(summary.net_worth);
  const assetsNum = Number(summary.total_assets);
  const liabilitiesNum = Number(summary.total_liabilities);

  const nw = formatCompactCurrency(netWorthNum, summary.base_currency);
  const assets = formatCompactCurrency(assetsNum, summary.base_currency);
  const liabilities = formatCompactCurrency(liabilitiesNum, summary.base_currency);

  return (
    <div className="relative overflow-hidden rounded-[32px] ios-glass-card p-6 sm:p-8 shadow-ios-card">
      {/* Liquid Ambient Light Orbs behind the card glass */}
      <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none animate-float-reverse" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Net Worth Value */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
              {COPY.NET_WORTH.TOTAL_NET_WORTH} ({summary.base_currency})
            </span>
            <span className="ios-badge ios-badge-neutral text-[10px]">
              <Sparkles className="h-3 w-3 text-pink-300" />
              FX Converted
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                {currencySymbol}
                {nw.compact}
              </span>
            </div>
            {nw.compact !== nw.full && (
              <span className="text-xs sm:text-sm font-semibold text-slate-400">
                ({currencySymbol}{nw.full})
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>
                {COPY.NET_WORTH.LIABILITY_RATIO}: <strong className="text-white font-bold">{formatPercent(summary.debt_to_asset_ratio, 1)}</strong>
              </span>
            </div>
            <span>•</span>
            <div>
              <span>
                {COPY.NET_WORTH.ASSETS_COUNT}: <strong className="text-white font-bold">{summary.asset_count}</strong>
              </span>
            </div>
            <span>•</span>
            <div>
              <span>
                {COPY.NET_WORTH.LIABILITIES_COUNT}: <strong className="text-white font-bold">{summary.liability_count}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onAddAsset}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl ios-btn-primary text-sm shadow-glass-glow"
          >
            <Plus className="h-4 w-4 stroke-[2.8]" />
            <span>{COPY.NET_WORTH.ADD_ASSET}</span>
          </button>

          <button
            onClick={onAddLiability}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl ios-btn-primary text-sm shadow-glass-glow"
          >
            <Plus className="h-4 w-4 stroke-[2.8]" />
            <span>{COPY.NET_WORTH.ADD_LIABILITY}</span>
          </button>
        </div>
      </div>

      {/* Asset vs Liability Quick Split Bar */}
      <div className="relative z-10 mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/[0.08]">
        <div className="ios-stat-card">
          <div className="h-12 w-12 rounded-2xl ios-icon-box ios-icon-box-emerald shrink-0">
            <TrendingUp className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{COPY.NET_WORTH.TOTAL_ASSETS}</span>
            <div className="text-xl sm:text-2xl font-black text-white">
              {currencySymbol}{assets.compact}
            </div>
            {assets.compact !== assets.full && (
              <div className="text-[11px] font-semibold text-slate-400">
                {currencySymbol}{assets.full}
              </div>
            )}
          </div>
        </div>

        <div className="ios-stat-card">
          <div className="h-12 w-12 rounded-2xl ios-icon-box ios-icon-box-rose shrink-0">
            <TrendingDown className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{COPY.NET_WORTH.TOTAL_LIABILITIES}</span>
            <div className="text-xl sm:text-2xl font-black text-white">
              {currencySymbol}{liabilities.compact}
            </div>
            {liabilities.compact !== liabilities.full && (
              <div className="text-[11px] font-semibold text-slate-400">
                {currencySymbol}{liabilities.full}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
