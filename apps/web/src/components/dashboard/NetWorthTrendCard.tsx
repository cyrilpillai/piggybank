"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { NetWorthHistoryResponse, HistoryRange } from "@/types";
import { formatCompactCurrency, formatPercent } from "@/lib/format";
import { GlassTrendChart, ChartDataPoint } from "@/components/ui/GlassTrendChart";
import { COPY } from "@/constants/copy";
import { LineChart, Calendar, Loader2, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

interface NetWorthTrendCardProps {
  currencySymbol: string;
  baseCurrency: string;
  refreshTrigger?: number;
}

const RANGES: { label: string; value: HistoryRange }[] = [
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "1Y", value: "1Y" },
  { label: "ALL", value: "ALL" },
];

export const NetWorthTrendCard: React.FC<NetWorthTrendCardProps> = ({
  currencySymbol,
  baseCurrency,
  refreshTrigger = 0,
}) => {
  const [selectedRange, setSelectedRange] = useState<HistoryRange>("1M");
  const [history, setHistory] = useState<NetWorthHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getNetWorthHistory(selectedRange, baseCurrency);
      setHistory(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : COPY.NET_WORTH_TREND.ERROR_DEFAULT;
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRange, baseCurrency]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshTrigger]);

  const netChangeNum = Number(history?.net_change) || 0;
  const isPositive = netChangeNum >= 0;
  const pctChange = history?.percentage_change || 0;
  const formattedNetChange = formatCompactCurrency(Math.abs(netChangeNum), baseCurrency);

  // Map history points to ChartDataPoint
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!history?.points || history.points.length === 0) return [];
    return history.points.map((pt) => ({
      date: pt.date,
      value: Number(pt.net_worth),
      total_assets: Number(pt.total_assets),
      total_liabilities: Number(pt.total_liabilities),
    }));
  }, [history]);

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[32px] ios-glass-card p-6 sm:p-8 shadow-ios-card flex flex-col justify-between">
      {/* Liquid Ambient Light Orbs behind the card glass */}
      <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Header: Title with Icon and Performance Pill */}
      <div className="relative z-10 flex flex-col gap-2 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl ios-icon-box ios-icon-box-pink shrink-0">
            <LineChart className="h-4 w-4" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight leading-none">
            {COPY.NET_WORTH_TREND.TITLE}
          </h3>
        </div>

        {/* Delta Performance Indicator below title */}
        {history && !isLoading && (
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-xs ${
                isPositive
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span>
                {isPositive ? "+" : "-"}
                {currencySymbol}
                {formattedNetChange.compact} ({formatPercent(Math.abs(pctChange), 1)})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="relative z-10 flex-1 flex flex-col justify-center min-w-0 mt-3">
        {isLoading ? (
          <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-pink-400" />
            <span className="text-xs font-semibold">{COPY.NET_WORTH_TREND.LOADING}</span>
          </div>
        ) : error ? (
          <div className="h-48 flex flex-col items-center justify-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <span>{error}</span>
            <button
              onClick={fetchHistory}
              className="px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 font-semibold transition"
            >
              {COPY.COMMON.RETRY}
            </button>
          </div>
        ) : (
          <GlassTrendChart
            data={chartData}
            color={isPositive ? "emerald" : "pink"}
            height={210}
            strokeWidth={2.4}
            tooltipMode="floating"
            formatValue={(v) => `${currencySymbol}${formatCompactCurrency(v, baseCurrency).compact}`}
            formatDate={formatDateLabel}
            renderTooltip={(pt) => {
              const ptNw = formatCompactCurrency(pt.value, baseCurrency);
              const ptAssets = formatCompactCurrency(pt.total_assets || 0, baseCurrency);
              const ptLiabs = formatCompactCurrency(pt.total_liabilities || 0, baseCurrency);

              return (
                <div className="relative overflow-hidden rounded-2xl ios-glass p-3.5 border border-white/15 border-t-white/35 shadow-glass-glow backdrop-blur-2xl text-xs space-y-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-150">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent pointer-events-none" />

                  <div className="relative z-10 flex items-center gap-1.5 text-slate-300 text-[10px] pb-1.5 border-b border-white/[0.08] font-mono">
                    <Calendar className="h-3 w-3 text-pink-300 shrink-0" />
                    <span className="font-semibold tracking-wide">{formatFullDate(pt.date)}</span>
                  </div>

                  <div className="relative z-10 space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-slate-400 font-medium">{COPY.NET_WORTH_TREND.TOOLTIP_NET_WORTH}:</span>
                      <span className="font-black text-white font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                        {currencySymbol}{ptNw.compact}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-emerald-400 font-medium">{COPY.NET_WORTH_TREND.TOOLTIP_ASSETS}:</span>
                      <span className="font-bold text-slate-200 font-mono">
                        {currencySymbol}{ptAssets.compact}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-rose-400 font-medium">{COPY.NET_WORTH_TREND.TOOLTIP_DEBTS}:</span>
                      <span className="font-bold text-slate-200 font-mono">
                        {currencySymbol}{ptLiabs.compact}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>

      {/* Timeframe Filter Tabs (Full Width at Bottom) */}
      <div className="relative z-10 pt-3 border-t border-white/[0.08] w-full">
        <div className="flex items-center justify-between bg-white/[0.06] p-1 rounded-2xl border border-white/[0.08] w-full">
          {RANGES.map((r) => {
            const isSelected = selectedRange === r.value;
            return (
              <button
                key={r.value}
                onClick={() => setSelectedRange(r.value)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold text-center transition-all duration-200 ${
                  isSelected
                    ? "bg-white/20 text-white shadow-sm border border-white/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
