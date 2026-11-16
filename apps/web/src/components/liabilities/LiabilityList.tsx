"use client";

import React, { useState, useMemo } from "react";
import { Liability } from "@/types";
import {
  TrendingDown,
  Pencil,
  Trash2,
  Building,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  SlidersHorizontal,
  Coins,
  Percent,
  Layers,
} from "lucide-react";
import { formatCurrencyAmount, convertToBaseCurrency, formatPercent } from "@/lib/format";
import { COPY } from "@/constants/copy";
import { GlassSelect, SelectOption } from "@/components/ui/GlassSelect";
import { GlassEmptyState } from "@/components/ui/GlassEmptyState";
import { GlassSearchInput } from "@/components/ui/GlassSearchInput";

interface LiabilityListProps {
  liabilities: Liability[];
  onEdit: (liability: Liability) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  baseCurrency?: string;
  rates?: Record<string, number>;
  showFilters?: boolean;
}

export type LiabilitySortValue =
  | "amount_desc"
  | "amount_asc"
  | "interest_desc"
  | "interest_asc"
  | "name_asc"
  | "name_desc"
  | "date_desc"
  | "date_asc"
  | "category_asc"
  | "category_desc";

const SORT_OPTIONS: SelectOption[] = [
  { value: "amount_desc", label: "Balance: High to Low" },
  { value: "amount_asc", label: "Balance: Low to High (Snowball)" },
  { value: "interest_desc", label: "Interest: High to Low (Avalanche)" },
  { value: "interest_asc", label: "Interest: Low to High" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
  { value: "date_desc", label: "Date: Newest First" },
  { value: "date_asc", label: "Date: Oldest First" },
  { value: "category_asc", label: "Category: A to Z" },
];

const INTEREST_OPTIONS: SelectOption[] = [
  { value: "ALL", label: "All Interest Types" },
  { value: "with_interest", label: "With Interest (> 0%)" },
  { value: "zero_interest", label: "0% / No Interest" },
];

export const LiabilityList: React.FC<LiabilityListProps> = ({
  liabilities,
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
  const [selectedInterestType, setSelectedInterestType] = useState("ALL");
  const [selectedCurrency, setSelectedCurrency] = useState("ALL");
  const [sortBy, setSortBy] = useState<LiabilitySortValue>("amount_desc");

  // Normalized amount in base currency for sorting & totals
  const getNormalizedAmount = (item: Liability): number => {
    return convertToBaseCurrency(item.amount, item.currency, baseCurrency, rates);
  };

  // Dynamic filter options based on available liabilities
  const categoryOptions: SelectOption[] = useMemo(() => {
    const cats = Array.from(new Set(liabilities.map((l) => l.category).filter(Boolean))).sort();
    return [
      { value: "ALL", label: "All Categories" },
      ...cats.map((c) => ({ value: c, label: c })),
    ];
  }, [liabilities]);

  const currencyOptions: SelectOption[] = useMemo(() => {
    const currs = Array.from(
      new Set(liabilities.map((l) => l.currency?.toUpperCase()).filter(Boolean))
    ).sort();
    return [
      { value: "ALL", label: "All Currencies" },
      ...currs.map((c) => ({ value: c, label: c })),
    ];
  }, [liabilities]);

  // Check if any filter or custom sort is active
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "ALL" ||
    selectedInterestType !== "ALL" ||
    selectedCurrency !== "ALL" ||
    sortBy !== "amount_desc";

  const activeFilterCount =
    (searchQuery.trim() !== "" ? 1 : 0) +
    (selectedCategory !== "ALL" ? 1 : 0) +
    (selectedInterestType !== "ALL" ? 1 : 0) +
    (selectedCurrency !== "ALL" ? 1 : 0) +
    (sortBy !== "amount_desc" ? 1 : 0);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedInterestType("ALL");
    setSelectedCurrency("ALL");
    setSortBy("amount_desc");
  };

  // Filtered & Sorted Liability List
  const filteredLiabilities = useMemo(() => {
    const filtered = liabilities.filter((item) => {
      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = item.name.toLowerCase().includes(q);
        const instMatch = item.institution?.toLowerCase().includes(q) ?? false;
        const notesMatch = item.notes?.toLowerCase().includes(q) ?? false;
        const catMatch = item.category?.toLowerCase().includes(q) ?? false;
        if (!nameMatch && !instMatch && !notesMatch && !catMatch) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }

      // Interest Type filter
      if (selectedInterestType === "with_interest") {
        const rate = item.interest_rate != null ? Number(item.interest_rate) : null;
        if (rate === null || isNaN(rate) || rate <= 0) {
          return false;
        }
      } else if (selectedInterestType === "zero_interest") {
        const rate = item.interest_rate != null ? Number(item.interest_rate) : null;
        if (rate !== null && !isNaN(rate) && rate > 0) {
          return false;
        }
      }

      // Currency filter
      if (
        selectedCurrency !== "ALL" &&
        item.currency.toUpperCase() !== selectedCurrency.toUpperCase()
      ) {
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
        case "interest_desc":
          return (Number(b.interest_rate) || 0) - (Number(a.interest_rate) || 0);
        case "interest_asc":
          return (Number(a.interest_rate) || 0) - (Number(b.interest_rate) || 0);
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
    liabilities,
    searchQuery,
    selectedCategory,
    selectedInterestType,
    selectedCurrency,
    sortBy,
    baseCurrency,
    rates,
  ]);

  // Total balance of filtered liabilities in base currency
  const filteredTotal = useMemo(() => {
    return filteredLiabilities.reduce((sum, item) => sum + getNormalizedAmount(item), 0);
  }, [filteredLiabilities, baseCurrency, rates]);

  // Clickable header sort toggler
  const handleHeaderSort = (field: "name" | "category" | "interest" | "amount") => {
    if (field === "name") {
      setSortBy(sortBy === "name_asc" ? "name_desc" : "name_asc");
    } else if (field === "category") {
      setSortBy(sortBy === "category_asc" ? "category_desc" : "category_asc");
    } else if (field === "interest") {
      setSortBy(sortBy === "interest_desc" ? "interest_asc" : "interest_desc");
    } else if (field === "amount") {
      setSortBy(sortBy === "amount_desc" ? "amount_asc" : "amount_desc");
    }
  };

  const renderSortIcon = (field: "name" | "category" | "interest" | "amount") => {
    const isAsc = sortBy === `${field}_asc`;
    const isDesc = sortBy === `${field}_desc`;
    if (isAsc) return <ArrowUp className="h-3.5 w-3.5 text-rose-400 shrink-0" />;
    if (isDesc) return <ArrowDown className="h-3.5 w-3.5 text-rose-400 shrink-0" />;
    return (
      <ArrowUpDown className="h-3 w-3 text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
    );
  };

  // If there are zero liabilities at all in the database
  if (liabilities.length === 0) {
    return (
      <GlassEmptyState
        icon={<TrendingDown className="h-7 w-7 stroke-[2.2]" />}
        iconColor="rose"
        title={COPY.LIABILITIES.EMPTY_TITLE}
        description={COPY.LIABILITIES.EMPTY_DESC}
        action={
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl ios-btn-primary text-sm shadow-glass-glow"
          >
            <span>{COPY.LIABILITIES.ADD_NEW}</span>
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
              placeholder={COPY.LIABILITIES.SEARCH_PLACEHOLDER}
            />

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-xs text-slate-400 font-medium hidden md:inline flex items-center gap-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {COPY.COMMON.SORT}
              </span>
              <GlassSelect
                value={sortBy}
                onChange={(val) => setSortBy(val as LiabilitySortValue)}
                options={SORT_OPTIONS}
                variant="pill"
                menuAlign="right"
                className="shrink-0"
              />
            </div>
          </div>

          {/* Bottom Row: Category, Interest Type, Currency Filters & Active Reset */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <GlassSelect
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                options={categoryOptions}
                variant="pill"
              />
            </div>

            {/* Interest Rate Filter */}
            <div className="flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <GlassSelect
                value={selectedInterestType}
                onChange={(val) => setSelectedInterestType(val)}
                options={INTEREST_OPTIONS}
                variant="pill"
              />
            </div>

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
              <span>{COPY.LIABILITIES.SHOWING} </span>
              <strong className="text-white">{filteredLiabilities.length}</strong>
              <span> {COPY.LIABILITIES.OF} </span>
              <strong className="text-white">{liabilities.length}</strong>
              <span> {COPY.LIABILITIES.LABEL_PLURAL}</span>
            </div>
            <div>
              <span>{COPY.LIABILITIES.FILTERED_TOTAL} </span>
              <strong className="text-rose-400 font-bold">
                {formatCurrencyAmount(filteredTotal, baseCurrency)} {baseCurrency}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* When filters yield 0 results */}
      {filteredLiabilities.length === 0 ? (
        <GlassEmptyState
          icon={<Search className="h-6 w-6 stroke-[1.8]" />}
          iconColor="slate"
          title={COPY.LIABILITIES.EMPTY_SEARCH_TITLE}
          description={COPY.LIABILITIES.EMPTY_SEARCH_DESC}
          action={
            hasActiveFilters ? (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl ios-btn-secondary text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{COPY.LIABILITIES.RESET_FILTERS}</span>
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
                      <span>{COPY.LIABILITIES.TABLE_HEADER_NAME}</span>
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
                      <span>{COPY.LIABILITIES.TABLE_HEADER_CATEGORY}</span>
                      {renderSortIcon("category")}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4">{COPY.LIABILITIES.TABLE_HEADER_LENDER}</th>
                  <th
                    scope="col"
                    onClick={() => handleHeaderSort("interest")}
                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors select-none group"
                    title="Sort by Interest Rate"
                  >
                    <div className="flex items-center gap-1">
                      <span>{COPY.LIABILITIES.TABLE_HEADER_INTEREST}</span>
                      {renderSortIcon("interest")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleHeaderSort("amount")}
                    className="px-6 py-4 text-right cursor-pointer hover:text-white transition-colors select-none group"
                    title="Sort by Balance"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{COPY.LIABILITIES.TABLE_HEADER_AMOUNT}</span>
                      {renderSortIcon("amount")}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-medium">
                {filteredLiabilities.map((item) => (
                  <tr key={item.id} className="ios-table-tr">
                    <td className="px-6 py-4 font-bold text-white">
                      <span>{item.name}</span>
                      {item.notes && (
                        <span className="block text-xs font-normal text-slate-400 mt-0.5">{item.notes}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="ios-badge ios-badge-rose">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {item.institution ? (
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Building className="h-3.5 w-3.5 text-slate-400" />
                          {item.institution}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {item.interest_rate !== null && item.interest_rate !== undefined ? (
                        <span className="font-bold text-amber-300">
                          {formatPercent(Number(item.interest_rate))}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(() => {
                        const isDiff = item.currency.toUpperCase() !== baseCurrency.toUpperCase();
                        const converted = convertToBaseCurrency(item.amount, item.currency, baseCurrency, rates);
                        return (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base font-black text-white">
                                {formatCurrencyAmount(item.amount, item.currency)}
                              </span>
                              <span className="ios-badge ios-badge-neutral text-xs text-rose-300">
                                {item.currency}
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
                          onClick={() => onEdit(item)}
                          className="ios-action-btn"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
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
            {filteredLiabilities.map((item) => {
              const isDiff = item.currency.toUpperCase() !== baseCurrency.toUpperCase();
              const converted = convertToBaseCurrency(item.amount, item.currency, baseCurrency, rates);
              return (
                <div
                  key={item.id}
                  className="rounded-[24px] ios-glass-card p-5 space-y-3 shadow-ios-card"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="ios-badge ios-badge-rose text-[11px]">
                          {item.category}
                        </span>
                        {item.institution && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Building className="h-3 w-3" /> {item.institution}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-white">
                        {formatCurrencyAmount(item.amount, item.currency)}
                      </div>
                      <span className="ios-badge ios-badge-neutral text-[10px] text-rose-300">
                        {item.currency}
                      </span>
                      {isDiff && (
                        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                          ≈ {formatCurrencyAmount(converted, baseCurrency)} {baseCurrency}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.interest_rate !== null && item.interest_rate !== undefined && (
                    <div className="text-xs text-amber-300 font-bold pt-1 border-t border-white/[0.06]">
                      <span>Interest Rate: {formatPercent(Number(item.interest_rate))}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => onEdit(item)}
                      className="ios-action-btn text-xs font-semibold px-3 py-1.5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="ios-action-btn-danger text-xs font-semibold px-3 py-1.5"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
