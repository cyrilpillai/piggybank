"use client";

import React, { useState, useEffect } from "react";
import { Asset, CurrencyItem, ASSET_CATEGORIES_MAP, ASSET_CATEGORIES, isSubCategoryLiquid } from "@/types";
import { TrendingUp, Flame, ShieldCheck } from "lucide-react";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { GlassModal } from "@/components/ui/GlassModal";
import { COPY } from "@/constants/copy";

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assetData: Partial<Asset>) => Promise<void>;
  editingAsset?: Asset | null;
  currencies: CurrencyItem[];
  defaultCurrency: string;
}

export const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAsset,
  currencies,
  defaultCurrency,
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(ASSET_CATEGORIES[0]);
  const [subCategory, setSubCategory] = useState(
    ASSET_CATEGORIES_MAP[ASSET_CATEGORIES[0]][0]
  );
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [institution, setInstitution] = useState("");
  const [notes, setNotes] = useState("");
  const [excludeFromFire, setExcludeFromFire] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingAsset) {
      setName(editingAsset.name);
      const cat = ASSET_CATEGORIES.includes(editingAsset.category)
        ? editingAsset.category
        : ASSET_CATEGORIES[0];
      setCategory(cat);
      setSubCategory(
        editingAsset.sub_category ||
          ASSET_CATEGORIES_MAP[cat]?.[0] ||
          ""
      );
      setAmount(String(editingAsset.amount));
      setCurrency(editingAsset.currency);
      setInstitution(editingAsset.institution || "");
      setNotes(editingAsset.notes || "");
      setExcludeFromFire(editingAsset.exclude_from_fire ?? false);
    } else {
      setName("");
      const initialCat = ASSET_CATEGORIES[0];
      setCategory(initialCat);
      setSubCategory(ASSET_CATEGORIES_MAP[initialCat][0]);
      setAmount("");
      setCurrency(defaultCurrency);
      setInstitution("");
      setNotes("");
      setExcludeFromFire(false);
    }
    setError(null);
  }, [editingAsset, defaultCurrency, isOpen]);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const subCats = ASSET_CATEGORIES_MAP[newCat] || [];
    setSubCategory(subCats[0] || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(COPY.ASSETS.VALIDATION_NAME);
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(COPY.ASSETS.VALIDATION_AMOUNT);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        category,
        sub_category: subCategory || null,
        amount: parsedAmount,
        currency,
        institution: institution.trim() || null,
        notes: notes.trim() || null,
        exclude_from_fire: isSubCategoryLiquid(subCategory) ? excludeFromFire : true,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save asset.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencyOptions = currencies.map((c) => ({
    value: c.code,
    label: `${c.code} (${c.symbol})`,
    sublabel: c.name,
    symbol: c.symbol,
  }));

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAsset ? COPY.ASSETS.MODAL_TITLE_EDIT : COPY.ASSETS.MODAL_TITLE_ADD}
      description={COPY.ASSETS.MODAL_DESC}
      icon={<TrendingUp className="h-5 w-5" />}
      iconColor="emerald"
      maxWidth="3xl"
      error={error}
      dismissible={!isSubmitting}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-2xl ios-btn-secondary text-sm"
          >
            {COPY.COMMON.CANCEL}
          </button>
          <button
            type="submit"
            form="asset-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-2xl ios-btn-primary text-sm shadow-glass-glow"
          >
            {isSubmitting ? COPY.ASSETS.SAVING_BUTTON : editingAsset ? COPY.ASSETS.UPDATE_BUTTON : COPY.ASSETS.SAVE_BUTTON}
          </button>
        </>
      }
    >
      <form id="asset-form" onSubmit={handleSubmit} className="space-y-3.5">
        {/* Row 1: Asset Name & Institution */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          <div className="sm:col-span-7">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Asset Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Zerodha Equity Portfolio, HDFC Savings, Gold"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl ios-glass-input px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Institution / Platform (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Zerodha, HDFC Bank, Vanguard"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full rounded-2xl ios-glass-input px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 2: Category & Sub Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Category *
            </label>
            <GlassSelect
              value={category}
              onChange={handleCategoryChange}
              options={ASSET_CATEGORIES}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sub Category *
            </label>
            <GlassSelect
              value={subCategory}
              onChange={setSubCategory}
              options={ASSET_CATEGORIES_MAP[category] || []}
            />
          </div>
        </div>

        {/* Row 3: Holdings Value & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          <div className="sm:col-span-7">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Holdings Value / Amount *
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-2xl ios-glass-input px-4 py-2.5 text-sm font-bold text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Currency *
            </label>
            <GlassSelect
              value={currency}
              onChange={setCurrency}
              options={currencyOptions}
            />
          </div>
        </div>

        {/* Row 4: Asset Purpose & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start">
          {isSubCategoryLiquid(subCategory) ? (
            <>
              <div className="sm:col-span-7">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Asset Purpose *
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">
                    {excludeFromFire ? "Excluded from FIRE" : "Included in FIRE"}
                  </span>
                </div>

                <div className="ios-segmented-track">
                  <button
                    type="button"
                    onClick={() => setExcludeFromFire(false)}
                    className={`ios-segmented-pill ${
                      !excludeFromFire
                        ? "ios-segmented-pill-active-pink"
                        : "ios-segmented-pill-inactive"
                    }`}
                  >
                    <Flame className={`h-3.5 w-3.5 ${!excludeFromFire ? "text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]" : "text-slate-400"}`} />
                    <span>Retirement / FIRE</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExcludeFromFire(true)}
                    className={`ios-segmented-pill ${
                      excludeFromFire
                        ? "ios-segmented-pill-active-amber"
                        : "ios-segmented-pill-inactive"
                    }`}
                  >
                    <ShieldCheck className={`h-3.5 w-3.5 ${excludeFromFire ? "text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" : "text-slate-400"}`} />
                    <span>Emergency Fund</span>
                  </button>
                </div>
              </div>

              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes / Identifiers (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Folio / Account #, maturity..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-2xl ios-glass-input px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </>
          ) : (
            <div className="sm:col-span-12">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Notes / Identifiers (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Folio / Account #, maturity date..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-2xl ios-glass-input px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      </form>
    </GlassModal>
  );
};
