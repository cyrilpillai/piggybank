"use client";

import React, { useState, useMemo } from "react";
import { Asset, isSubCategoryLiquid } from "@/types";
import {
  TrendingUp,
  Pencil,
  Trash2,
  Building,
  Layers,
  Sparkles,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  SlidersHorizontal,
  Coins,
  Flame,
  ShieldCheck,
} from "lucide-react";
import { formatCurrencyAmount, convertToBaseCurrency } from "@/lib/format";
import { GlassSelect, SelectOption } from "@/components/ui/GlassSelect";
import { GlassEmptyState } from "@/components/ui/GlassEmptyState";
import { GlassSearchInput } from "@/components/ui/GlassSearchInput";

interface AssetListProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  baseCurrency?: string;
  rates?: Record<string, number>;
  showFilters?: boolean;
}

export type AssetSortValue =
  | "amount_desc"
  | "amount_asc"
  | "name_asc"
  | "name_desc"
  | "date_desc"
  | "date_asc"
  | "category_asc"
  | "category_desc";

const SORT_OPTIONS: SelectOption[] = [
  { value: "amount_desc", label: "Amount: High to Low" },
  { value: "amount_asc", label: "Amount: Low to High" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
  { value: "date_desc", label: "Date: Newest First" },
  { value: "date_asc", label: "Date: Oldest First" },
  { value: "category_asc", label: "Category: A to Z" },
];

const SOURCE_OPTIONS: SelectOption[] = [
  { value: "ALL", label: "All Sources" },
  { value: "synced", label: "Synced Only" },
  { value: "manual", label: "Manual Only" },
];

const PURPOSE_OPTIONS: SelectOption[] = [
  { value: "ALL", label: "All Purposes" },
  { value: "fire", label: "Retirement / FIRE" },
  { value: "emergency", label: "Emergency Fund" },
];

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  onEdit,
  onDelete,
  onAddNew,
  baseCurrency = "INR",
  rates = {},
  showFilters = true,
}) => {
  // --- Filter and Sort State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSubCategory, setSelectedSubCategory] = useState("ALL");
  const [selectedCurrency, setSelectedCurrency] = useState("ALL");
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [selectedPurpose, setSelectedPurpose] = useState("ALL");
  const [sortBy, setSortBy] = useState<AssetSortValue>("amount_desc");

  // Normalized amount in base currency for sorting & totals
  const getNormalizedAmount = (asset: Asset): number => {
    return convertToBaseCurrency(asset.amount, asset.currency, baseCurrency, rates);
  };

  // Dynamic filter options based on available assets
  const categoryOptions: SelectOption[] = useMemo(() => {
    const cats = Array.from(new Set(assets.map((a) => a.category).filter(Boolean))).sort();
    return [
      { value: "ALL", label: "All Categories" },
      ...cats.map((c) => ({ value: c, label: c })),
    ];
  }, [assets]);

  const subCategoryOptions: SelectOption[] = useMemo(() => {
    const subs = Array.from(
      new Set(
        assets
          .filter((a) => selectedCategory === "ALL" || a.category === selectedCategory)
          .map((a) => a.sub_category)
          .filter((s): s is string => Boolean(s))
      )
    ).sort();
    return [
      { value: "ALL", label: "All Sub-categories" },
      ...subs.map((s) => ({ value: s, label: s })),
    ];
  }, [assets, selectedCategory]);

  const currencyOptions: SelectOption[] = useMemo(() => {
    const currs = Array.from(
      new Set(assets.map((a) => a.currency?.toUpperCase()).filter(Boolean))
    ).sort();
    return [
      { value: "ALL", label: "All Currencies" },
      ...currs.map((c) => ({ value: c, label: c })),
    ];
  }, [assets]);

  const hasAutomatedAssets = useMemo(() => assets.some((a) => a.is_automated), [assets]);

  // Check if any filter or custom sort is active
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "ALL" ||
    selectedSubCategory !== "ALL" ||
    selectedCurrency !== "ALL" ||
    selectedSource !== "ALL" ||
    selectedPurpose !== "ALL" ||
    sortBy !== "amount_desc";

  const activeFilterCount =
    (searchQuery.trim() !== "" ? 1 : 0) +
    (selectedCategory !== "ALL" ? 1 : 0) +
    (selectedSubCategory !== "ALL" ? 1 : 0) +
    (selectedCurrency !== "ALL" ? 1 : 0) +
    (selectedSource !== "ALL" ? 1 : 0) +
    (selectedPurpose !== "ALL" ? 1 : 0) +
    (sortBy !== "amount_desc" ? 1 : 0);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedSubCategory("ALL");
    setSelectedCurrency("ALL");
    setSelectedSource("ALL");
    setSelectedPurpose("ALL");
    setSortBy("amount_desc");
  };

  // Filtered & Sorted Asset List
  const filteredAssets = useMemo(() => {
    const filtered = assets.filter((asset) => {
      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = asset.name.toLowerCase().includes(q);
        const instMatch = asset.institution?.toLowerCase().includes(q) ?? false;
        const notesMatch = asset.notes?.toLowerCase().includes(q) ?? false;
        const catMatch = asset.category?.toLowerCase().includes(q) ?? false;
        const subMatch = asset.sub_category?.toLowerCase().includes(q) ?? false;
        if (!nameMatch && !instMatch && !notesMatch && !catMatch && !subMatch) {
          return false;
        }
      }

      // Purpose filter (only applies to liquid assets)
      if (selectedPurpose === "fire" && (!isSubCategoryLiquid(asset.sub_category) || asset.exclude_from_fire)) {
        return false;
      }
      if ((selectedPurpose === "emergency" || selectedPurpose === "reserve") && (!isSubCategoryLiquid(asset.sub_category) || !asset.exclude_from_fire)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== "ALL" && asset.category !== selectedCategory) {
        return false;
      }

      // Sub-category filter
      if (selectedSubCategory !== "ALL" && asset.sub_category !== selectedSubCategory) {
        return false;
      }

      // Currency filter
      if (
        selectedCurrency !== "ALL" &&
        asset.currency.toUpperCase() !== selectedCurrency.toUpperCase()
      ) {
        return false;
      }

      // Source filter
      if (selectedSource === "synced" && !asset.is_automated) {
        return false;
      }
      if (selectedSource === "manual" && asset.is_automated) {
        return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "amount_desc":
          return getNormalizedAmount(b) - getNormalizedAmount(a);
        case "amount_asc":
          return getNormalizedAmount(a) - getNormalizedAmount(b);
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "date_desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "date_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "category_asc":
          return a.category.localeCompare(b.category);
        case "category_desc":
          return b.category.localeCompare(a.category);
        default:
          return 0;
      }
    });
  }, [
    assets,
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedCurrency,
    selectedSource,
    sortBy,
    baseCurrency,
    rates,
  ]);

  // Total amount of filtered assets in base currency
  const filteredTotal = useMemo(() => {
    return filteredAssets.reduce((sum, item) => sum + getNormalizedAmount(item), 0);
  }, [filteredAssets, baseCurrency, rates]);

  // Clickable header sort toggler
  const handleHeaderSort = (field: "name" | "category" | "amount") => {
    if (field === "name") {
      setSortBy(sortBy === "name_asc" ? "name_desc" : "name_asc");
    } else if (field === "category") {
      setSortBy(sortBy === "category_asc" ? "category_desc" : "category_asc");
    } else if (field === "amount") {
      setSortBy(sortBy === "amount_desc" ? "amount_asc" : "amount_desc");
    }
  };

  const renderSortIcon = (field: "name" | "category" | "amount") => {
    const isAsc = sortBy === `${field}_asc`;
    const isDesc = sortBy === `${field}_desc`;
    if (isAsc) return <ArrowUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
    if (isDesc) return <ArrowDown className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
    return (
      <ArrowUpDown className="h-3 w-3 text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
    );
  };

  // If there are zero assets at all in the database
  if (assets.length === 0) {
    return (
      <GlassEmptyState
        icon={<TrendingUp className="h-7 w-7 stroke-[2.2]" />}
        iconColor="emerald"
        title="Your Piggybank is Empty!"
        description="Feed your piggybank with your savings, stocks, mutual funds, real estate, or gold to watch your wealth grow."
        action={
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl ios-btn-primary text-sm shadow-glass-glow"
          >
            <span>Feed the Piggybank (Add Asset)</span>
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Configurable Filters & Sort Toolbar */}
      {showFilters && (
        <div className="relative z-20 ios-toolbar-card space-y-3.5">
          {/* Top Row: Search Input & Sort Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Bar */}
            <GlassSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search assets by name, institution, notes..."
            />

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-xs text-slate-400 font-medium hidden md:inline flex items-center gap-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Sort:
              </span>
              <GlassSelect
                value={sortBy}
                onChange={(val) => setSortBy(val as AssetSortValue)}
                options={SORT_OPTIONS}
                variant="pill"
                menuAlign="right"
                className="shrink-0"
              />
            </div>
          </div>

          {/* Bottom Row: Category, Subcategory, Currency, Source Filters & Active Reset */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <GlassSelect
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val);
                  setSelectedSubCategory("ALL"); // Reset subcategory when category changes
                }}
                options={categoryOptions}
                variant="pill"
              />
            </div>

            {/* Sub-category Filter (shown when available) */}
            {subCategoryOptions.length > 1 && (
              <GlassSelect
                value={selectedSubCategory}
                onChange={(val) => setSelectedSubCategory(val)}
                options={subCategoryOptions}
                variant="pill"
              />
            )}

            {/* Currency Filter (shown when more than 1 currency exists) */}
            {currencyOptions.length > 2 && (
              <div className="flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <GlassSelect
                  value={selectedCurrency}
                  onChange={(val) => setSelectedCurrency(val)}
                  options={currencyOptions}
                  variant="pill"
                />
              </div>
            )}

            {/* Source / Sync Filter (shown if synced assets exist) */}
            {hasAutomatedAssets && (
              <GlassSelect
                value={selectedSource}
                onChange={(val) => setSelectedSource(val)}
                options={SOURCE_OPTIONS}
                variant="pill"
              />
            )}

            {/* Purpose Filter */}
            <GlassSelect
              value={selectedPurpose}
              onChange={(val) => setSelectedPurpose(val)}
              options={PURPOSE_OPTIONS}
              variant="pill"
            />

            {/* Reset Filters Action Button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="ios-badge ios-badge-rose hover:bg-rose-500/25 cursor-pointer ml-auto text-xs py-1.5 px-3 transition"
                title="Reset all filters and sorting"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset ({activeFilterCount})</span>
              </button>
            )}
          </div>

          {/* Status / Count / Filtered Total Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400 font-medium">
            <div>
              <span>Showing </span>
              <strong className="text-white">{filteredAssets.length}</strong>
              <span> of </span>
              <strong className="text-white">{assets.length}</strong>
              <span> assets</span>
            </div>
            <div>
              <span>Filtered Total: </span>
              <strong className="text-emerald-400 font-bold">
                {formatCurrencyAmount(filteredTotal, baseCurrency)} {baseCurrency}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* When filters yield 0 results */}
      {filteredAssets.length === 0 ? (
        <GlassEmptyState
          icon={<Search className="h-6 w-6 stroke-[1.8]" />}
          iconColor="slate"
          title="No assets match your filters"
          description="Try adjusting your search keywords, switching categories, or resetting active filters."
          action={
            hasActiveFilters ? (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl ios-btn-secondary text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset all filters</span>
              </button>
            ) : null
          }
        />
      ) : (
        <>
          {/* Desktop / Tablet Table */}
          <div className="relative z-10 hidden sm:block ios-table-card">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="ios-table-thead">
                <tr>
                  <th
                    scope="col"
                    onClick={() => handleHeaderSort("name")}
                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors select-none group"
                    title="Sort by Name"
                  >
                    <div className="flex items-center gap-1">
                      <span>Asset Name</span>
                      {renderSortIcon("name")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleHeaderSort("category")}
                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors select-none group"
                    title="Sort by Category"
                  >
                    <div className="flex items-center gap-1">
                      <span>Category & Sub Category</span>
                      {renderSortIcon("category")}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4">Institution</th>
                  <th
                    scope="col"
                    onClick={() => handleHeaderSort("amount")}
                    className="px-6 py-4 text-right cursor-pointer hover:text-white transition-colors select-none group"
                    title="Sort by Amount"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Amount</span>
                      {renderSortIcon("amount")}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-medium">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="ios-table-tr">
                    <td className="px-6 py-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <span>{asset.name}</span>
                        {isSubCategoryLiquid(asset.sub_category) && (
                          asset.exclude_from_fire ? (
                            <span className="ios-badge ios-badge-amber text-[10px] inline-flex items-center gap-1" title="Emergency Fund (Excluded from FIRE)">
                              <ShieldCheck className="h-2.5 w-2.5 text-amber-400" />
                              Emergency
                            </span>
                          ) : (
                            <span className="ios-badge ios-badge-pink text-[10px] inline-flex items-center gap-1" title="Retirement / FIRE">
                              <Flame className="h-2.5 w-2.5 text-pink-400" />
                              FIRE
                            </span>
                          )
                        )}
                        {asset.is_automated && (
                          <span className="ios-badge ios-badge-indigo text-[10px]">
                            <Sparkles className="h-2.5 w-2.5" />
                            Synced
                          </span>
                        )}
                      </div>
                      {asset.notes && (
                        <span className="block text-xs font-normal text-slate-400 mt-0.5">{asset.notes}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="ios-badge ios-badge-emerald w-fit">
                          <Layers className="h-3 w-3 text-emerald-400" />
                          {asset.category}
                        </span>
                        {asset.sub_category && (
                          <span className="text-[11px] font-semibold text-slate-400 pl-1">
                            {asset.sub_category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {asset.institution ? (
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Building className="h-3.5 w-3.5 text-slate-400" />
                          {asset.institution}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(() => {
                        const isDiff = asset.currency.toUpperCase() !== baseCurrency.toUpperCase();
                        const converted = convertToBaseCurrency(asset.amount, asset.currency, baseCurrency, rates);
                        return (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base font-black text-white">
                                {formatCurrencyAmount(asset.amount, asset.currency)}
                              </span>
                              <span className="ios-badge ios-badge-neutral text-xs text-emerald-300">
                                {asset.currency}
                              </span>
                            </div>
                            {isDiff && (
                              <span className="text-xs font-semibold text-slate-400 mt-0.5">
                                ≈ {formatCurrencyAmount(converted, baseCurrency)} {baseCurrency}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(asset)}
                          className="ios-action-btn"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(asset.id)}
                          className="ios-action-btn-danger"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout (< sm) */}
          <div className="relative z-10 sm:hidden space-y-3">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-[24px] ios-glass-card p-5 space-y-3 shadow-ios-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">{asset.name}</h4>
                      {isSubCategoryLiquid(asset.sub_category) && (
                        asset.exclude_from_fire ? (
                          <span className="ios-badge ios-badge-amber text-[9px] inline-flex items-center gap-1" title="Emergency Fund (Excluded from FIRE)">
                            <ShieldCheck className="h-2 w-2 text-amber-400" />
                            Emergency
                          </span>
                        ) : (
                          <span className="ios-badge ios-badge-pink text-[9px] inline-flex items-center gap-1">
                            <Flame className="h-2 w-2 text-pink-400" />
                            FIRE
                          </span>
                        )
                      )}
                      {asset.is_automated && (
                        <span className="ios-badge ios-badge-indigo text-[9px]">
                          <Sparkles className="h-2 w-2" />
                          Synced
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="ios-badge ios-badge-emerald text-[11px]">
                        {asset.category}
                      </span>
                      {asset.sub_category && (
                        <span className="ios-badge ios-badge-neutral text-[11px]">
                          {asset.sub_category}
                        </span>
                      )}
                      {asset.institution && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-1">
                          <Building className="h-3 w-3" /> {asset.institution}
                        </span>
                      )}
                    </div>
                    {asset.notes && (
                      <p className="text-xs text-slate-400 mt-1">{asset.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {(() => {
                      const isDiff = asset.currency.toUpperCase() !== baseCurrency.toUpperCase();
                      const converted = convertToBaseCurrency(asset.amount, asset.currency, baseCurrency, rates);
                      return (
                        <>
                          <div className="text-lg font-black text-white">
                            {formatCurrencyAmount(asset.amount, asset.currency)}
                          </div>
                          <span className="ios-badge ios-badge-neutral text-[10px] text-emerald-300">
                            {asset.currency}
                          </span>
                          {isDiff && (
                            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                              ≈ {formatCurrencyAmount(converted, baseCurrency)} {baseCurrency}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                  <button
                    onClick={() => onEdit(asset)}
                    className="ios-action-btn text-xs font-semibold px-3 py-1.5"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(asset.id)}
                    className="ios-action-btn-danger text-xs font-semibold px-3 py-1.5"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
