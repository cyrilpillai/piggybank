"use client";

import React, { useMemo } from "react";
import { Asset } from "@/types";
import { convertToBaseCurrency } from "@/lib/format";
import {
  GlassTreemap,
  TreemapCategoryData,
  TreemapHolding,
} from "@/components/ui/GlassTreemap";
import { COPY } from "@/constants/copy";
import { LayoutGrid, ArrowRight } from "lucide-react";

interface PortfolioTreemapCardProps {
  assets: Asset[];
  currencySymbol: string;
  baseCurrency: string;
  rates: Record<string, number>;
  onViewAll?: () => void;
}

interface PaletteColor {
  hex: string;
  dot: string;
  bgTint: string;
  borderTint: string;
  gradient: string;
  text: string;
}

const CATEGORY_PALETTE: Record<string, PaletteColor> = {
  Equity: {
    hex: "#8b5cf6",
    dot: "bg-violet-400",
    bgTint: "bg-violet-500/10",
    borderTint: "border-violet-500/30",
    gradient: "from-violet-500 to-purple-600",
    text: "text-violet-300",
  },
  "Cash & Bank": {
    hex: "#10b981",
    dot: "bg-emerald-400",
    bgTint: "bg-emerald-500/10",
    borderTint: "border-emerald-500/30",
    gradient: "from-emerald-400 to-teal-500",
    text: "text-emerald-300",
  },
  "Fixed Income": {
    hex: "#0ea5e9",
    dot: "bg-sky-400",
    bgTint: "bg-sky-500/10",
    borderTint: "border-sky-500/30",
    gradient: "from-sky-400 to-blue-500",
    text: "text-sky-300",
  },
  Commodities: {
    hex: "#f59e0b",
    dot: "bg-amber-400",
    bgTint: "bg-amber-500/10",
    borderTint: "border-amber-500/30",
    gradient: "from-amber-400 to-orange-500",
    text: "text-amber-300",
  },
  "Real Estate": {
    hex: "#ec4899",
    dot: "bg-pink-400",
    bgTint: "bg-pink-500/10",
    borderTint: "border-pink-500/30",
    gradient: "from-pink-400 to-rose-500",
    text: "text-pink-300",
  },
  Crypto: {
    hex: "#06b6d4",
    dot: "bg-cyan-400",
    bgTint: "bg-cyan-500/10",
    borderTint: "border-cyan-500/30",
    gradient: "from-cyan-400 to-blue-500",
    text: "text-cyan-300",
  },
  Vehicles: {
    hex: "#6366f1",
    dot: "bg-indigo-400",
    bgTint: "bg-indigo-500/10",
    borderTint: "border-indigo-500/30",
    gradient: "from-indigo-400 to-violet-500",
    text: "text-indigo-300",
  },
};

const FALLBACK_PALETTE: PaletteColor[] = [
  {
    hex: "#14b8a6",
    dot: "bg-teal-400",
    bgTint: "bg-teal-500/10",
    borderTint: "border-teal-500/30",
    gradient: "from-teal-400 to-emerald-500",
    text: "text-teal-300",
  },
  {
    hex: "#a855f7",
    dot: "bg-purple-400",
    bgTint: "bg-purple-500/10",
    borderTint: "border-purple-500/30",
    gradient: "from-purple-400 to-pink-500",
    text: "text-purple-300",
  },
  {
    hex: "#3b82f6",
    dot: "bg-blue-400",
    bgTint: "bg-blue-500/10",
    borderTint: "border-blue-500/30",
    gradient: "from-blue-400 to-indigo-500",
    text: "text-blue-300",
  },
];

export const PortfolioTreemapCard: React.FC<PortfolioTreemapCardProps> = ({
  assets,
  currencySymbol,
  baseCurrency,
  rates,
  onViewAll,
}) => {
  // Aggregate and structure assets into nested category groups
  const { categories, portfolioTotal } = useMemo(() => {
    if (!assets || assets.length === 0) {
      return { categories: [], portfolioTotal: 0 };
    }

    const catMap = new Map<
      string,
      {
        totalValue: number;
        holdings: TreemapHolding[];
      }
    >();

    let totalVal = 0;

    for (const asset of assets) {
      const baseVal = convertToBaseCurrency(
        asset.amount,
        asset.currency,
        baseCurrency,
        rates
      );
      if (baseVal <= 0) continue;

      totalVal += baseVal;
      const catKey = asset.category || COPY.PORTFOLIO_TREEMAP.OTHER_CATEGORY;
      const isDiff =
        asset.currency.toUpperCase() !== baseCurrency.toUpperCase();

      if (!catMap.has(catKey)) {
        catMap.set(catKey, {
          totalValue: 0,
          holdings: [],
        });
      }

      const catEntry = catMap.get(catKey)!;
      catEntry.totalValue += baseVal;
      catEntry.holdings.push({
        id: asset.id,
        name: asset.name,
        category: catKey,
        subCategory: asset.sub_category || undefined,
        value: baseVal,
        amount: asset.amount,
        currency: asset.currency,
        isDiffCurrency: isDiff,
        raw: asset,
      });
    }

    // Sort categories descending by value
    const sortedCats = Array.from(catMap.entries()).sort(
      (a, b) => b[1].totalValue - a[1].totalValue
    );

    let fallbackIdx = 0;
    const catList: TreemapCategoryData[] = sortedCats.map(([catName, entry]) => {
      // Sort holdings inside category descending by value
      entry.holdings.sort((a, b) => b.value - a.value);

      const color =
        CATEGORY_PALETTE[catName] ||
        FALLBACK_PALETTE[fallbackIdx++ % FALLBACK_PALETTE.length];

      const percentage = totalVal > 0 ? (entry.totalValue / totalVal) * 100 : 0;

      return {
        category: catName,
        totalValue: entry.totalValue,
        percentage,
        color,
        holdings: entry.holdings,
      };
    });

    return {
      categories: catList,
      portfolioTotal: totalVal,
    };
  }, [assets, baseCurrency, rates]);

  return (
    <div className="relative overflow-hidden rounded-[32px] ios-glass-card p-6 sm:p-8 shadow-ios-card flex flex-col justify-between h-full">
      {/* Liquid Ambient Light Orbs behind the card glass */}
      <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

      {/* Header: Title, Count and View All Button */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl ios-icon-box ios-icon-box-cyan shrink-0">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight leading-none">
              {COPY.PORTFOLIO_TREEMAP.TITLE}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">
              {assets.length}{" "}
              {assets.length === 1
                ? COPY.PORTFOLIO_TREEMAP.ITEM_SUFFIX
                : COPY.PORTFOLIO_TREEMAP.ITEMS_SUFFIX}
            </span>
          </div>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-semibold transition ios-glass-pill px-3.5 py-1.5 rounded-full"
          >
            <span>
              {COPY.OVERVIEW.VIEW_ALL} ({assets.length})
            </span>
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Treemap Canvas Area: expands to fill all available vertical & horizontal space */}
      <div className="relative z-10 flex-1 w-full min-h-[240px] mt-3 flex flex-col">
        <GlassTreemap
          categories={categories}
          portfolioTotal={portfolioTotal}
          currencySymbol={currencySymbol}
          baseCurrency={baseCurrency}
          emptyMessage={COPY.PORTFOLIO_TREEMAP.EMPTY_TITLE}
          className="flex-1 w-full h-full"
        />
      </div>
    </div>
  );
};
