"use client";

import React, { useState, useEffect } from "react";
import { Liability, CurrencyItem, LIABILITY_CATEGORIES } from "@/types";
import { TrendingDown, Percent } from "lucide-react";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { GlassModal } from "@/components/ui/GlassModal";
import { COPY } from "@/constants/copy";

interface LiabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (liabilityData: Partial<Liability>) => Promise<void>;
  editingLiability?: Liability | null;
  currencies: CurrencyItem[];
  defaultCurrency: string;
}

export const LiabilityModal: React.FC<LiabilityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingLiability,
  currencies,
  defaultCurrency,
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(LIABILITY_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [interestRate, setInterestRate] = useState("");
  const [institution, setInstitution] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingLiability) {
      setName(editingLiability.name);
      setCategory(
        LIABILITY_CATEGORIES.includes(editingLiability.category)
          ? editingLiability.category
          : LIABILITY_CATEGORIES[0]
      );
      setAmount(String(editingLiability.amount));
      setCurrency(editingLiability.currency);
      setInterestRate(
        editingLiability.interest_rate !== null && editingLiability.interest_rate !== undefined
          ? String(editingLiability.interest_rate)
          : ""
      );
      setInstitution(editingLiability.institution || "");
      setNotes(editingLiability.notes || "");
    } else {
      setName("");
      setCategory(LIABILITY_CATEGORIES[0]);
      setAmount("");
      setCurrency(defaultCurrency);
      setInterestRate("");
      setInstitution("");
      setNotes("");
    }
    setError(null);
  }, [editingLiability, defaultCurrency, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(COPY.LIABILITIES.VALIDATION_NAME);
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(COPY.LIABILITIES.VALIDATION_AMOUNT);
      return;
    }

    let parsedInterestRate: number | null = null;
    if (interestRate.trim()) {
      parsedInterestRate = parseFloat(interestRate);
      if (isNaN(parsedInterestRate) || parsedInterestRate < 0 || parsedInterestRate > 100) {
        setError("Interest rate must be between 0% and 100%.");
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        category,
        amount: parsedAmount,
        currency,
        interest_rate: parsedInterestRate,
        institution: institution.trim() || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save liability.";
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
      title={editingLiability ? COPY.LIABILITIES.MODAL_TITLE_EDIT : COPY.LIABILITIES.MODAL_TITLE_ADD}
      description={COPY.LIABILITIES.MODAL_DESC}
      icon={<TrendingDown className="h-5 w-5" />}
      iconColor="rose"
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
            form="liability-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-2xl ios-btn-primary text-sm shadow-glass-glow"
          >
            {isSubmitting
              ? COPY.LIABILITIES.SAVING_BUTTON
              : editingLiability
              ? COPY.LIABILITIES.UPDATE_BUTTON
              : COPY.LIABILITIES.SAVE_BUTTON}
          </button>
        </>
      }
    >
      <form id="liability-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Liability / Loan Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Home Loan, Education Loan, Automobile Loan, Credit Card"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl ios-glass-input px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-7">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Outstanding Balance *
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Currency *
              </label>
              <GlassSelect
                value={currency}
                onChange={setCurrency}
                options={currencyOptions}
              />
            </div>
          </div>

          {/* Category & Interest Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Category *
              </label>
              <GlassSelect
                value={category}
                onChange={setCategory}
                options={LIABILITY_CATEGORIES}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Interest Rate % (Optional)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 6.75"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full rounded-2xl ios-glass-input px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                <Percent className="h-3.5 w-3.5 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Institution & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Lender / Bank (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank, Wells Fargo, Chase"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full rounded-2xl ios-glass-input px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Notes / Identifiers (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Account #, EMI date..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-2xl ios-glass-input px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </form>
    </GlassModal>
  );
};
