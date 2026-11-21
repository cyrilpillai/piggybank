"use client";

import React, { useMemo } from "react";
import { Asset, Liability } from "@/types";
import {
  convertToBaseCurrency,
  formatCompactCurrency,
  formatCompactWithSymbol,
  formatPercent,
} from "@/lib/format";
import { GlassBarChart, BarChartItem } from "@/components/ui/GlassBarChart";
import { COPY } from "@/constants/copy";
import { TrendingUp, TrendingDown, ArrowRight, Tag } from "lucide-react";

interface HoldingsBarChartCardProps {
  title: string;
  type: "asset" | "liability";
  items: (Asset | Liability)[];
  currencySymbol: string;
  baseCurrency: string;
  rates: Record<string, number>;
  onViewAll: () => void;
}

export const HoldingsBarChartCard: React.FC<HoldingsBarChartCardProps> = ({
  title,
  type,
  items,
  currencySymbol,
  baseCurrency,
  rates,
  onViewAll,
}) => {
  const isAsset = type === "asset";

  // Compute and group top 10 items (top 9 + Others if > 10)
  const { chartItems } = useMemo(() => {
    if (!items || items.length === 0) {
      return { chartItems: [] };
    }

    // Map each holding to base currency value for accurate relative bar heights
    const normalized = items.map((item) => {
      const baseVal = convertToBaseCurrency(item.amount, item.currency, baseCurrency, rates);
      const isDiff = item.currency.toUpperCase() !== baseCurrency.toUpperCase();
      const typeLabel =
        "sub_category" in item && item.sub_category ? item.sub_category : item.category;

      return {
        id: item.id,
        name: item.name,
        category: typeLabel,
        amount: item.amount,
        currency: item.currency,
        baseVal,
        isDiff,
      };
    });

    // Sort descending by base currency value
    normalized.sort((a, b) => b.baseVal - a.baseVal);

    const total = normalized.reduce((acc, curr) => acc + curr.baseVal, 0);

    // Apply max 10 rule: top 9 individual bars + 10th consolidated "Others"
    let finalItems: BarChartItem[] = [];

    if (normalized.length <= 10) {
      finalItems = normalized.map((item) => {
        const pct = total > 0 ? (item.baseVal / total) * 100 : 0;
        const registeredStr = formatCompactWithSymbol(item.amount, item.currency);

        return {
          label: item.name,
          value: item.baseVal,
          formattedValue: registeredStr,
          secondaryLabel: item.category,
          isOthers: false,
          raw: {
            ...item,
            pct,
          },
        };
      });
    } else {
      const top9 = normalized.slice(0, 9);
      const othersList = normalized.slice(9);
      const othersSum = othersList.reduce((acc, curr) => acc + curr.baseVal, 0);
      const othersPct = total > 0 ? (othersSum / total) * 100 : 0;
      const compactOthers = formatCompactCurrency(othersSum, baseCurrency).compact;

      finalItems = top9.map((item) => {
        const pct = total > 0 ? (item.baseVal / total) * 100 : 0;
        const registeredStr = formatCompactWithSymbol(item.amount, item.currency);

        return {
          label: item.name,
          value: item.baseVal,
          formattedValue: registeredStr,
          secondaryLabel: item.category,
          isOthers: false,
          raw: {
            ...item,
            pct,
          },
        };
      });

      finalItems.push({
        label: COPY.HOLDINGS_CHART.OTHERS,
        value: othersSum,
        formattedValue: `${currencySymbol}${compactOthers}`,
        secondaryLabel: `${othersList.length} items`,
        isOthers: true,
        raw: {
          name: `${othersList.length} ${isAsset ? "Other Assets" : "Other Liabilities"}`,
          category: COPY.HOLDINGS_CHART.OTHERS,
          baseVal: othersSum,
          pct: othersPct,
          isOthersGroup: true,
          count: othersList.length,
        },
      });
    }

    return { chartItems: finalItems };
  }, [items, isAsset, baseCurrency, rates, currencySymbol]);

  return (
    <div className="relative overflow-hidden rounded-[32px] ios-glass-card p-6 sm:p-8 shadow-ios-card flex flex-col justify-between">
      {/* Liquid Ambient Light Orbs behind the card glass */}
      <div
        className={`absolute -right-12 -top-12 h-64 w-64 rounded-full ${
          isAsset ? "bg-emerald-500/10" : "bg-rose-500/10"
        } blur-3xl pointer-events-none`}
      />

      {/* Header: Title, Count and View All Button */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div
            className={`h-9 w-9 rounded-xl ios-icon-box ${
              isAsset ? "ios-icon-box-emerald" : "ios-icon-box-rose"
            } shrink-0`}
          >
            {isAsset ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {items.length} {items.length === 1 ? (isAsset ? "item" : "item") : (isAsset ? "items" : "items")}
            </span>
          </div>
        </div>

        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-semibold transition ios-glass-pill px-3.5 py-1.5 rounded-full"
        >
          <span>
            {COPY.OVERVIEW.VIEW_ALL} ({items.length})
          </span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative z-10 flex-1 flex flex-col justify-center min-w-0 mt-3">
        <GlassBarChart
          items={chartItems}
          color={isAsset ? "emerald" : "rose"}
          height={210}
          emptyMessage={
            isAsset
              ? COPY.OVERVIEW.NO_ASSETS_RECORDED
              : COPY.OVERVIEW.NO_LIABILITIES_RECORDED
          }
          formatValue={(val) => formatCompactWithSymbol(val, baseCurrency)}
          renderTooltip={(item) => {
            const raw = item.raw || {};
            const isOthers = Boolean(item.isOthers);
            const isDiff = Boolean(raw.isDiff);
            const pct = formatPercent(raw.pct || 0, 1);
            const baseCompact = formatCompactCurrency(item.value, baseCurrency).compact;

            return (
              <div className="relative overflow-hidden rounded-2xl ios-glass p-3.5 border border-white/15 border-t-white/35 shadow-glass-glow backdrop-blur-2xl text-xs space-y-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-150">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent pointer-events-none" />

                <div className="relative z-10 pb-1.5 border-b border-white/[0.08]">
                  <div className="font-bold text-white truncate text-xs">{raw.name || item.label}</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                    <Tag className="h-2.5 w-2.5" />
                    <span className="capitalize">{raw.category}</span>
                  </div>
                </div>

                <div className="relative z-10 space-y-1.5">
                  {/* Registered currency balance (if not an aggregated Others group) */}
                  {!isOthers ? (
                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-slate-400 font-medium">Balance:</span>
                      <span className="font-black text-white font-mono">
                        {formatCompactWithSymbol(raw.amount, raw.currency)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-slate-400 font-medium">Total:</span>
                      <span className="font-black text-white font-mono">
                        {currencySymbol}
                        {baseCompact}
                      </span>
                    </div>
                  )}

                  {/* Converted Balance ONLY if registered currency != base currency */}
                  {isDiff && !isOthers && (
                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-slate-400 font-medium">{baseCurrency}:</span>
                      <span className="font-bold text-slate-200 font-mono">
                        ≈ {currencySymbol}
                        {baseCompact}
                      </span>
                    </div>
                  )}

                  {/* Portfolio Share */}
                  <div className="flex items-center justify-between gap-3 text-[11px] pt-0.5">
                    <span className="text-slate-400 font-medium">{COPY.HOLDINGS_CHART.TOOLTIP_SHARE}:</span>
                    <span
                      className={`font-black font-mono ${
                        isAsset ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {pct}
                    </span>
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};
