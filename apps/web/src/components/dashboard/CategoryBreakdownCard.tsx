"use client";

import React, { useState, useMemo } from "react";
import { CategoryBreakdown, Asset, Liability } from "@/types";
import {
  TrendingUp,
  TrendingDown,
  Inbox,
  Sparkles,
} from "lucide-react";
import {
  formatPercent,
  formatCompactCurrency,
  convertToBaseCurrency,
  clampToTopSplits,
} from "@/lib/format";
import { GlassEmptyState } from "@/components/ui/GlassEmptyState";
import { GlassDonutChart, GlassDonutSegment } from "@/components/ui/GlassDonutChart";
import { GlassSegmentedBar, GlassSegmentItem } from "@/components/ui/GlassSegmentedBar";
import { COPY } from "@/constants/copy";

interface CategoryBreakdownCardProps {
  title: string;
  type: "asset" | "liability";
  categories: CategoryBreakdown[];
  currencySymbol: string;
  onAddItem: () => void;
  baseCurrency?: string;
  items?: (Asset | Liability)[];
  rates?: Record<string, number>;
}

interface CategoryColor {
  hex: string;
  dot: string;
  bgTint: string;
  borderTint: string;
  gradient: string;
  text: string;
}

const ASSET_PALETTE: Record<string, CategoryColor> = {
  "Equity": {
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
  "Commodities": {
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
};

const LIABILITY_PALETTE: Record<string, CategoryColor> = {
  "Home Loan": {
    hex: "#6366f1",
    dot: "bg-indigo-400",
    bgTint: "bg-indigo-500/10",
    borderTint: "border-indigo-500/30",
    gradient: "from-indigo-500 to-violet-600",
    text: "text-indigo-300",
  },
  "Mortgage": {
    hex: "#6366f1",
    dot: "bg-indigo-400",
    bgTint: "bg-indigo-500/10",
    borderTint: "border-indigo-500/30",
    gradient: "from-indigo-500 to-violet-600",
    text: "text-indigo-300",
  },
  "Credit Card": {
    hex: "#f43f5e",
    dot: "bg-rose-400",
    bgTint: "bg-rose-500/10",
    borderTint: "border-rose-500/30",
    gradient: "from-rose-500 to-pink-600",
    text: "text-rose-300",
  },
  "Personal Loan": {
    hex: "#f59e0b",
    dot: "bg-amber-400",
    bgTint: "bg-amber-500/10",
    borderTint: "border-amber-500/30",
    gradient: "from-amber-400 to-orange-500",
    text: "text-amber-300",
  },
  "Automobile Loan": {
    hex: "#06b6d4",
    dot: "bg-cyan-400",
    bgTint: "bg-cyan-500/10",
    borderTint: "border-cyan-500/30",
    gradient: "from-cyan-400 to-blue-500",
    text: "text-cyan-300",
  },
  "Education Loan": {
    hex: "#a855f7",
    dot: "bg-purple-400",
    bgTint: "bg-purple-500/10",
    borderTint: "border-purple-500/30",
    gradient: "from-purple-400 to-violet-500",
    text: "text-purple-300",
  },
  "Business Loan": {
    hex: "#3b82f6",
    dot: "bg-blue-400",
    bgTint: "bg-blue-500/10",
    borderTint: "border-blue-500/30",
    gradient: "from-blue-400 to-indigo-500",
    text: "text-blue-300",
  },
  "Real Estate": {
    hex: "#ec4899",
    dot: "bg-pink-400",
    bgTint: "bg-pink-500/10",
    borderTint: "border-pink-500/30",
    gradient: "from-pink-400 to-rose-500",
    text: "text-pink-300",
  },
  "Other Liabilities": {
    hex: "#14b8a6",
    dot: "bg-teal-400",
    bgTint: "bg-teal-500/10",
    borderTint: "border-teal-500/30",
    gradient: "from-teal-400 to-emerald-500",
    text: "text-teal-300",
  },
  "Other": {
    hex: "#14b8a6",
    dot: "bg-teal-400",
    bgTint: "bg-teal-500/10",
    borderTint: "border-teal-500/30",
    gradient: "from-teal-400 to-emerald-500",
    text: "text-teal-300",
  },
};

const FALLBACK_PALETTE: CategoryColor[] = [
  { hex: "#6366f1", dot: "bg-indigo-400", bgTint: "bg-indigo-500/10", borderTint: "border-indigo-500/30", gradient: "from-indigo-400 to-violet-500", text: "text-indigo-300" },
  { hex: "#f43f5e", dot: "bg-rose-400", bgTint: "bg-rose-500/10", borderTint: "border-rose-500/30", gradient: "from-rose-400 to-pink-500", text: "text-rose-300" },
  { hex: "#f59e0b", dot: "bg-amber-400", bgTint: "bg-amber-500/10", borderTint: "border-amber-500/30", gradient: "from-amber-400 to-orange-500", text: "text-amber-300" },
  { hex: "#06b6d4", dot: "bg-cyan-400", bgTint: "bg-cyan-500/10", borderTint: "border-cyan-500/30", gradient: "from-cyan-400 to-blue-500", text: "text-cyan-300" },
  { hex: "#a855f7", dot: "bg-purple-400", bgTint: "bg-purple-500/10", borderTint: "border-purple-500/30", gradient: "from-purple-400 to-violet-500", text: "text-purple-300" },
  { hex: "#14b8a6", dot: "bg-teal-400", bgTint: "bg-teal-500/10", borderTint: "border-teal-500/30", gradient: "from-teal-400 to-emerald-500", text: "text-teal-300" },
  { hex: "#ec4899", dot: "bg-pink-400", bgTint: "bg-pink-500/10", borderTint: "border-pink-500/30", gradient: "from-pink-400 to-rose-500", text: "text-pink-300" },
  { hex: "#84cc16", dot: "bg-lime-400", bgTint: "bg-lime-500/10", borderTint: "border-lime-500/30", gradient: "from-lime-400 to-green-500", text: "text-lime-300" },
  { hex: "#3b82f6", dot: "bg-blue-400", bgTint: "bg-blue-500/10", borderTint: "border-blue-500/30", gradient: "from-blue-400 to-indigo-500", text: "text-blue-300" },
];

const SUB_CATEGORY_PALETTES = [
  { hex: "#34d399", dot: "bg-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-300" },
  { hex: "#38bdf8", dot: "bg-sky-400", border: "border-sky-500/30", bg: "bg-sky-500/10", text: "text-sky-300" },
  { hex: "#a78bfa", dot: "bg-violet-400", border: "border-violet-500/30", bg: "bg-violet-500/10", text: "text-violet-300" },
  { hex: "#fbbf24", dot: "bg-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-300" },
  { hex: "#fb7185", dot: "bg-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/10", text: "text-rose-300" },
  { hex: "#818cf8", dot: "bg-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/10", text: "text-indigo-300" },
  { hex: "#2dd4bf", dot: "bg-teal-400", border: "border-teal-500/30", bg: "bg-teal-500/10", text: "text-teal-300" },
  { hex: "#e879f9", dot: "bg-fuchsia-400", border: "border-fuchsia-500/30", bg: "bg-fuchsia-500/10", text: "text-fuchsia-300" },
  { hex: "#a3e635", dot: "bg-lime-400", border: "border-lime-500/30", bg: "bg-lime-500/10", text: "text-lime-300" },
];

export const CategoryBreakdownCard: React.FC<CategoryBreakdownCardProps> = ({
  title,
  type,
  categories,
  currencySymbol,
  onAddItem,
  baseCurrency = "INR",
  items,
  rates = {},
}) => {
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

  const isAsset = type === "asset";
  const Icon = isAsset ? TrendingUp : TrendingDown;

  const getCategoryColor = (catName: string, index: number): CategoryColor => {
    const palette = isAsset ? ASSET_PALETTE : LIABILITY_PALETTE;
    if (palette[catName]) return palette[catName];
    // Case-insensitive & trimmed lookup
    const lower = catName.trim().toLowerCase();
    for (const [key, val] of Object.entries(palette)) {
      if (key.toLowerCase() === lower) return val;
    }
    return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
  };

  const totalPortfolioAmount = useMemo(() => {
    return categories.reduce((sum, c) => sum + Number(c.total_amount || 0), 0);
  }, [categories]);

  const hasAnySubCategories = useMemo(() => {
    return categories.some((c) => c.sub_categories && c.sub_categories.length > 0);
  }, [categories]);

  // Generic Donut Segments for GlassDonutChart (clamped to max 10)
  const donutSegments: GlassDonutSegment[] = useMemo(() => {
    return categories.map((cat, idx) => ({
      label: cat.category,
      value: Number(cat.total_amount) || 0,
      percentage: Number(cat.percentage) || 0,
      color: getCategoryColor(cat.category, idx).hex,
      category: cat,
    }));
  }, [categories, isAsset]);

  const activeCategory = useMemo(() => {
    if (!selectedCategoryName) return null;
    return categories.find((c) => c.category === selectedCategoryName) || null;
  }, [selectedCategoryName, categories]);

  // Format currency helper (always compact)
  const formatCompact = (val: number | string) => {
    return formatCompactCurrency(val, baseCurrency).compact;
  };

  // Split items for active category (sub-types for assets, or individual items for liabilities)
  const activeSplitItems: GlassSegmentItem[] = useMemo(() => {
    if (!activeCategory) return [];

    // Case 1: Category has defined sub_categories (Assets)
    if (activeCategory.sub_categories && activeCategory.sub_categories.length > 0) {
      const rawSubItems = activeCategory.sub_categories.map((sub) => ({
        label: sub.sub_category,
        value: Number(sub.total_amount) || 0,
        percentage: Number(sub.percentage) || 0,
        count: sub.count,
        formattedValue: `${currencySymbol}${formatCompact(sub.total_amount)}`,
      }));

      // Sort descending by value
      rawSubItems.sort((a, b) => b.value - a.value);

      const clamped = clampToTopSplits(rawSubItems, 10, {
        formatValue: (val) => `${currencySymbol}${formatCompact(val)}`,
      });

      return clamped.map((item, idx) => {
        if (item.label === "Others") {
          return {
            ...item,
            color: "#64748b",
            dotColor: "bg-slate-500",
            textColor: "text-slate-400",
          };
        }
        const palette = SUB_CATEGORY_PALETTES[idx % SUB_CATEGORY_PALETTES.length];
        return {
          ...item,
          color: palette.hex,
          dotColor: palette.dot,
          textColor: palette.text,
        };
      });
    }

    // Case 2: Individual item split (Liabilities or assets without sub-types)
    if (items && items.length > 0) {
      const matchingItems = items.filter((it) => it.category === activeCategory.category);
      if (matchingItems.length === 0) return [];

      const catTotal = Number(activeCategory.total_amount) || 0;
      const rawItems = matchingItems.map((it) => {
        const baseVal = convertToBaseCurrency(it.amount, it.currency, baseCurrency, rates);
        const pct = catTotal > 0 ? (baseVal / catTotal) * 100 : 0;
        return {
          label: it.name,
          value: baseVal,
          percentage: pct,
          count: 1,
          institution: (it as any).institution || undefined,
          formattedValue: `${currencySymbol}${formatCompact(baseVal)}`,
        };
      });

      // Sort descending by base currency value
      rawItems.sort((a, b) => b.value - a.value);

      const clamped = clampToTopSplits(rawItems, 10, {
        formatValue: (val) => `${currencySymbol}${formatCompact(val)}`,
      });

      return clamped.map((item, idx) => {
        if (item.label === "Others") {
          return {
            ...item,
            color: "#64748b",
            dotColor: "bg-slate-500",
            textColor: "text-slate-400",
          };
        }
        const palette = SUB_CATEGORY_PALETTES[idx % SUB_CATEGORY_PALETTES.length];
        return {
          ...item,
          color: palette.hex,
          dotColor: palette.dot,
          textColor: palette.text,
        };
      });
    }

    return [];
  }, [activeCategory, items, baseCurrency, rates, currencySymbol]);

  // Count of items belonging to active category
  const activeCategoryItemCount = useMemo(() => {
    if (!activeCategory || !items) return 0;
    return items.filter((it) => it.category === activeCategory.category).length;
  }, [activeCategory, items]);

  return (
    <div className="rounded-[32px] ios-glass-card p-6 sm:p-8 flex flex-col justify-between shadow-ios-card transition-all duration-300">
      <div>
        {/* Top Header Row: Icon, Title & Category Count */}
        <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-white/[0.08] mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`h-9 w-9 rounded-xl ios-icon-box ${
                isAsset ? "ios-icon-box-emerald" : "ios-icon-box-rose"
              } shrink-0`}
            >
              <Icon className="h-4 w-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {selectedCategoryName ? (
                  <span
                    className={`${
                      isAsset ? "text-emerald-300" : "text-rose-300"
                    } flex items-center gap-1 font-semibold`}
                  >
                    <Sparkles className="h-3 w-3" />
                    Focused on: <strong className="text-white">{selectedCategoryName}</strong>
                  </span>
                ) : (
                  <span>
                    {isAsset
                      ? hasAnySubCategories
                        ? COPY.CATEGORIES.DRILLDOWN_HINT
                        : "Click any segment to inspect details"
                      : "Click any segment to inspect split"}
                  </span>
                )}
              </p>
            </div>
          </div>

          <span className="ios-badge ios-badge-neutral text-xs font-semibold px-3 py-1 shrink-0">
            {categories.length} {categories.length === 1 ? "Type" : "Types"}
          </span>
        </div>

        {/* Empty State */}
        {categories.length === 0 ? (
          <GlassEmptyState
            icon={<Inbox className="h-7 w-7 stroke-[1.8]" />}
            iconColor="slate"
            title={
              isAsset
                ? COPY.CATEGORIES.EMPTY_ASSETS_TITLE
                : COPY.CATEGORIES.EMPTY_LIABILITIES_TITLE
            }
            description={
              isAsset
                ? COPY.CATEGORIES.EMPTY_ASSETS_DESC
                : COPY.CATEGORIES.EMPTY_LIABILITIES_DESC
            }
            className="my-6"
            action={
              <button
                onClick={onAddItem}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold ios-btn-primary shadow-glass-glow"
              >
                {isAsset ? COPY.CATEGORIES.ADD_ASSET_BTN : COPY.CATEGORIES.ADD_LIABILITY_BTN}
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {/* Reusable Glass Donut Chart & Dynamic Center Readout */}
            <div className="pt-1 pb-2 flex justify-center">
              <GlassDonutChart
                segments={donutSegments}
                selectedLabel={selectedCategoryName}
                onSelect={(seg) => setSelectedCategoryName(seg ? seg.label : null)}
                size={340}
                thickness={46}
                renderCenter={(activeSeg) => {
                  const active = activeSeg ? (activeSeg.category as CategoryBreakdown) : null;
                  if (active) {
                    return (
                      <div className="space-y-1 animate-in fade-in zoom-in-95 duration-150">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block max-w-[150px] truncate mx-auto">
                          {active.category}
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-white tracking-tight block">
                          {currencySymbol}
                          {formatCompact(active.total_amount)}
                        </span>
                        <div className="flex items-center justify-center gap-1.5 pt-0.5">
                          <span className="ios-badge ios-badge-neutral text-xs font-bold text-white">
                            {formatPercent(active.percentage, 2)}
                          </span>
                          {active.sub_categories && active.sub_categories.length > 0 ? (
                            <span className="text-xs text-emerald-400 font-semibold">
                              {active.sub_categories.length} sub-types
                            </span>
                          ) : activeCategoryItemCount > 0 ? (
                            <span
                              className={`text-xs ${
                                isAsset ? "text-emerald-400" : "text-rose-400"
                              } font-semibold`}
                            >
                              {activeCategoryItemCount}{" "}
                              {activeCategoryItemCount === 1
                                ? isAsset
                                  ? "asset"
                                  : "liability"
                                : isAsset
                                ? "assets"
                                : "liabilities"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        {isAsset ? "Total Assets" : "Total Liabilities"}
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-white tracking-tight block">
                        {currencySymbol}
                        {formatCompact(totalPortfolioAmount)}
                      </span>
                      <span className="text-xs text-slate-400 font-medium block">
                        {categories.length} {categories.length === 1 ? "type" : "types"}
                      </span>
                    </div>
                  );
                }}
              />
            </div>

            {/* Split Panel (Shows sub-types for assets or individual holdings for liabilities) */}
            {selectedCategoryName && activeCategory && activeSplitItems.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        getCategoryColor(activeCategory.category, 0).dot
                      } shadow-sm shrink-0`}
                    />
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {activeCategory.category}{" "}
                      {activeCategory.sub_categories &&
                      activeCategory.sub_categories.length > 0
                        ? COPY.CATEGORIES.SUB_CATEGORIES
                        : "Split"}
                    </h4>
                  </div>
                  <span className="ios-badge ios-badge-neutral text-xs font-semibold shrink-0">
                    {currencySymbol}
                    {formatCompact(activeCategory.total_amount)} (
                    {formatPercent(activeCategory.percentage, 2)})
                  </span>
                </div>

                {/* Single Progress Bar with Colors & Full-Width Legend Details */}
                <GlassSegmentedBar
                  segments={activeSplitItems}
                  totalValue={Number(activeCategory.total_amount) || 0}
                  height="md"
                  legendVariant="list"
                  maxSegments={10}
                  formatValue={(val) => `${currencySymbol}${formatCompact(val)}`}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
