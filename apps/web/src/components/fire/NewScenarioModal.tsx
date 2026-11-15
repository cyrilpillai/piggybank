"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { GlassModal } from "@/components/ui/GlassModal";

interface NewScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  currencySymbol: string;
  baseCurrency?: string;
}

export const NewScenarioModal: React.FC<NewScenarioModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currencySymbol,
  baseCurrency = "INR",
}) => {
  const isINR = baseCurrency === "INR";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expenses, setExpenses] = useState(isINR ? 50000 : 2000);
  const [goalAge, setGoalAge] = useState(50);
  const [contribution, setContribution] = useState(isINR ? 25000 : 1000);
  const [swr, setSwr] = useState(4.0);
  const [annualReturn, setAnnualReturn] = useState(10.0);
  const [inflation, setInflation] = useState(6.0);
  const [taxRate, setTaxRate] = useState(15.0);
  const [growthRate, setGrowthRate] = useState(5.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        monthly_expenses_retirement: expenses,
        retirement_age_goal: goalAge,
        monthly_contribution: contribution,
        swr: swr / 100.0,
        expected_annual_return: annualReturn / 100.0,
        inflation: inflation / 100.0,
        tax_rate_retirement: taxRate / 100.0,
        contribution_growth_rate: growthRate / 100.0,
      });
      setName("");
      setDescription("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="New FIRE Scenario"
      description="Configure parameters for a retirement timeline model"
      icon={<Sparkles className="h-5 w-5" />}
      iconColor="pink"
      maxWidth="lg"
      dismissible={!isSubmitting}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-2xl ios-btn-secondary text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-scenario-form"
            disabled={isSubmitting || !name.trim()}
            className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white ios-btn-primary shadow-glass-glow disabled:opacity-50 transition"
          >
            {isSubmitting ? "Creating..." : "Create Plan"}
          </button>
        </>
      }
    >
      <form id="new-scenario-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Scenario Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Lean FIRE, Fat FIRE, Barista Mode, Coasting at 45"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl ios-glass-input text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Description (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Higher equity allocation, lower retirement spending in Tier-2 city"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl ios-glass-input text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Monthly Retirement Expenses ({currencySymbol})
            </label>
            <input
              type="number"
              min="1000"
              step="1000"
              value={expenses}
              onChange={(e) => setExpenses(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-2xl ios-glass-input text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Goal Retirement Age
            </label>
            <input
              type="number"
              min="20"
              max="100"
              value={goalAge}
              onChange={(e) => setGoalAge(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-2xl ios-glass-input text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Monthly Contribution ({currencySymbol})
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={contribution}
              onChange={(e) => setContribution(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-2xl ios-glass-input text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Safe Withdrawal Rate (SWR %)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              step="0.1"
              value={swr}
              onChange={(e) => setSwr(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-2xl ios-glass-input text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Expected Annual Return (%)
            </label>
            <input
              type="number"
              min="1"
              max="25"
              step="0.5"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-2xl ios-glass-input text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Expected Inflation (%)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.5"
              value={inflation}
              onChange={(e) => setInflation(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-2xl ios-glass-input text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Retirement Tax Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              step="1"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-2xl ios-glass-input text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Yearly Contribution Step-Up (%)
            </label>
            <input
              type="number"
              min="0"
              max="25"
              step="0.5"
              value={growthRate}
              onChange={(e) => setGrowthRate(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-2xl ios-glass-input text-xs font-mono text-white focus:outline-none"
            />
          </div>
        </div>
      </form>
    </GlassModal>
  );
};
