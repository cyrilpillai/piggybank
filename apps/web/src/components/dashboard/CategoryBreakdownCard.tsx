"use client";

import React, { useState } from "react";
import { CategoryBreakdown } from "@/types";
import { TrendingUp, TrendingDown, Inbox, ChevronDown } from "lucide-react";
import { formatCurrencyAmount } from "@/lib/format";
import { GlassEmptyState } from "@/components/ui/GlassEmptyState";

interface CategoryBreakdownCardProps {
  title: string;
  type: "asset" | "liability";
  categories: CategoryBreakdown[];
  currencySymbol: string;
  onAddItem: () => void;
  baseCurrency?: string;
}

const SUB_CATEGORY_PALETTES = [
  { bg: "bg-emerald-400", dot: "bg-emerald-400", gradient: "from-emerald-400 to-teal-400", text: "text-emerald-300" },
  { bg: "bg-sky-400", dot: "bg-sky-400", gradient: "from-sky-400 to-blue-400", text: "text-sky-300" },
  { bg: "bg-violet-400", dot: "bg-violet-400", gradient: "from-violet-400 to-purple-400", text: "text-violet-300" },
  { bg: "bg-amber-400", dot: "bg-amber-400", gradient: "from-amber-400 to-orange-400", text: "text-amber-300" },
  { bg: "bg-rose-400", dot: "bg-rose-400", gradient: "from-rose-400 to-pink-400", text: "text-rose-300" },
  { bg: "bg-indigo-400", dot: "bg-indigo-400", gradient: "from-indigo-400 to-blue-500", text: "text-indigo-300" },
  { bg: "bg-teal-300", dot: "bg-teal-300", gradient: "from-teal-300 to-emerald-400", text: "text-teal-200" },
  { bg: "bg-fuchsia-400", dot: "bg-fuchsia-400", gradient: "from-fuchsia-400 to-pink-500", text: "text-fuchsia-300" },
  { bg: "bg-lime-400", dot: "bg-lime-400", gradient: "from-lime-400 to-green-400", text: "text-lime-300" },
];

export const CategoryBreakdownCard: React.FC<CategoryBreakdownCardProps> = ({
  title,
  type,
  categories,
  currencySymbol,
  onAddItem,
  baseCurrency = "INR",
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const isAsset = type === "asset";
  const accentGradient = isAsset
    ? "from-emerald-400 to-teal-400"
    : "from-rose-500 to-amber-500";
  const Icon = isAsset ? TrendingUp : TrendingDown;

  const formatAmount = (val: number | string) => {
    return formatCurrencyAmount(val, baseCurrency);
  };

  const toggleCategory = (catName: string) => {
    setExpandedCategory((prev) => (prev === catName ? null : catName));
  };

  return (
    <div className="rounded-[32px] ios-glass-card p-6 flex flex-col justify-between shadow-ios-card">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 ios-icon-box ${isAsset ? "ios-icon-box-emerald" : "ios-icon-box-rose"}`}>
              <Icon className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              {isAsset && categories.length > 0 && (
                <p className="text-[10px] text-slate-400 font-medium">
                  Tap any category to explore sub-categories
                </p>
              )}
            </div>
          </div>
          <span className="ios-badge ios-badge-neutral text-[11px]">
            {categories.length} {categories.length === 1 ? "Category" : "Categories"}
          </span>
        </div>

        {categories.length === 0 ? (
          <GlassEmptyState
            icon={<Inbox className="h-6 w-6 stroke-[1.8]" />}
            iconColor="slate"
            title={`No ${isAsset ? "assets" : "liabilities"} added yet.`}
            description={`Add your first ${
              isAsset ? "holdings (e.g. Demat, bank savings)" : "debt (e.g. home loan, credit card)"
            } to see the category breakdown.`}
            className="my-2"
            action={
              <button
                onClick={onAddItem}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold ios-btn-primary shadow-glass-glow"
              >
                + Add {isAsset ? "Asset" : "Liability"}
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => {
              const hasSubCategories = Boolean(cat.sub_categories && cat.sub_categories.length > 0);
              const isExpanded = expandedCategory === cat.category;

              return (
                <div
                  key={cat.category}
                  className={`p-3 rounded-2xl transition-all duration-200 border ${
                    isExpanded
                      ? "bg-white/[0.06] border-white/20 shadow-md"
                      : hasSubCategories
                      ? "hover:bg-white/[0.04] border-transparent hover:border-white/10 cursor-pointer"
                      : "hover:bg-white/[0.02] border-transparent"
                  }`}
                  onClick={hasSubCategories ? () => toggleCategory(cat.category) : undefined}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{cat.category}</span>
                        {hasSubCategories && (
                          <span className="ios-badge ios-badge-neutral text-[10px]">
                            <span>{cat.sub_categories!.length} {cat.sub_categories!.length === 1 ? "sub-type" : "sub-types"}</span>
                            <ChevronDown
                              className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-emerald-300" : ""
                              }`}
                            />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {currencySymbol}
                          {formatAmount(cat.total_amount)}
                        </span>
                        <span className="text-slate-400 font-semibold w-10 text-right">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Main Category Line: Multi-color Split if has sub-categories, otherwise accentGradient */}
                    <div className="h-2 w-full rounded-full bg-white/[0.06] p-0.5 overflow-hidden shadow-inner">
                      {hasSubCategories ? (
                        <div
                          className="h-full rounded-full overflow-hidden flex gap-[1px] shadow-sm transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(3, cat.percentage))}%` }}
                        >
                          {cat.sub_categories!.map((sub, idx) => {
                            const palette = SUB_CATEGORY_PALETTES[idx % SUB_CATEGORY_PALETTES.length];
                            return (
                              <div
                                key={sub.sub_category}
                                className={`h-full ${palette.bg} transition-all duration-300`}
                                style={{ width: `${Math.max(2, sub.percentage)}%` }}
                                title={`${sub.sub_category}: ${sub.percentage}%`}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${accentGradient} shadow-sm transition-all duration-500`}
                          style={{ width: `${Math.min(100, Math.max(3, cat.percentage))}%` }}
                        />
                      )}
                    </div>

                    {/* Small Inline Legend Mentioning the Sub Type Next to the Color */}
                    {hasSubCategories && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                        {cat.sub_categories!.map((sub, idx) => {
                          const palette = SUB_CATEGORY_PALETTES[idx % SUB_CATEGORY_PALETTES.length];
                          return (
                            <span
                              key={sub.sub_category}
                              className="inline-flex items-center gap-1.5 text-[11px] text-slate-300"
                            >
                              <span className={`h-2 w-2 rounded-full shrink-0 ${palette.dot} shadow-sm`} />
                              <span className="font-medium text-slate-300">{sub.sub_category}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Expanded: Dedicated Single Lines for each Sub-category in its Respective Legend Color */}
                  {isExpanded && hasSubCategories && (
                    <div
                      className="mt-3 pt-3 border-t border-white/[0.08] space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-0.5">
                        <span>Sub-category Breakdown</span>
                        <span>% of {cat.category}</span>
                      </div>

                      <div className="space-y-2.5">
                        {cat.sub_categories!.map((sub, idx) => {
                          const palette = SUB_CATEGORY_PALETTES[idx % SUB_CATEGORY_PALETTES.length];
                          return (
                            <div
                              key={sub.sub_category}
                              className="space-y-1 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.04]"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-200 flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${palette.dot} shadow-sm`} />
                                  {sub.sub_category}
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    ({sub.count} {sub.count === 1 ? "item" : "items"})
                                  </span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">
                                    {currencySymbol}
                                    {formatAmount(sub.total_amount)}
                                  </span>
                                  <span className={`font-bold w-10 text-right text-xs ${palette.text}`}>
                                    {sub.percentage}%
                                  </span>
                                </div>
                              </div>

                              {/* Single line for this sub-category in its respective legend color */}
                              <div className="h-1.5 w-full rounded-full bg-white/[0.05] p-[1px] overflow-hidden">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${palette.gradient} opacity-95 transition-all duration-300 shadow-sm`}
                                  style={{ width: `${Math.min(100, Math.max(3, sub.percentage))}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
