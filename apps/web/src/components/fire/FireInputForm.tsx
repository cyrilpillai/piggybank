"use client";

import React, { useState, useEffect, useRef } from "react";
import { FireScenario } from "@/types";
import { formatCurrencyAmount, formatPercent } from "@/lib/format";
import { Sliders, Save, RotateCcw, HelpCircle } from "lucide-react";
import { GlassSlider } from "@/components/ui/GlassSlider";
import { COPY } from "@/constants/copy";

interface FireInputFormProps {
  scenario: FireScenario;
  currencySymbol: string;
  baseCurrency?: string;
  isSaving: boolean;
  onSave: (updatedValues: Partial<FireScenario>) => Promise<void>;
  onLiveCalculate: (values: any) => void;
}

export const FireInputForm: React.FC<FireInputFormProps> = ({
  scenario,
  currencySymbol,
  baseCurrency = "INR",
  isSaving,
  onSave,
  onLiveCalculate,
}) => {
  // Local editable form state
  const [expenses, setExpenses] = useState<number>(Number(scenario.monthly_expenses_retirement) || 50000);
  const [goalAge, setGoalAge] = useState<number>(scenario.retirement_age_goal || 55);
  const [contribution, setContribution] = useState<number>(Number(scenario.monthly_contribution) || 25000);
  const [swr, setSwr] = useState<number>(scenario.swr ? scenario.swr * 100 : 4.0);
  const [annualReturn, setAnnualReturn] = useState<number>(
    scenario.expected_annual_return ? scenario.expected_annual_return * 100 : 10.0
  );
  const [inflation, setInflation] = useState<number>(
    scenario.inflation ? scenario.inflation * 100 : 6.0
  );
  const [taxRate, setTaxRate] = useState<number>(
    scenario.tax_rate_retirement ? scenario.tax_rate_retirement * 100 : 15.0
  );
  const [growthRate, setGrowthRate] = useState<number>(
    scenario.contribution_growth_rate ? scenario.contribution_growth_rate * 100 : 0.0
  );

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if active scenario changes externally
  useEffect(() => {
    setExpenses(Number(scenario.monthly_expenses_retirement) || 50000);
    setGoalAge(scenario.retirement_age_goal || 55);
    setContribution(Number(scenario.monthly_contribution) || 25000);
    setSwr(scenario.swr ? scenario.swr * 100 : 4.0);
    setAnnualReturn(scenario.expected_annual_return ? scenario.expected_annual_return * 100 : 10.0);
    setInflation(scenario.inflation ? scenario.inflation * 100 : 6.0);
    setTaxRate(scenario.tax_rate_retirement ? scenario.tax_rate_retirement * 100 : 15.0);
    setGrowthRate(scenario.contribution_growth_rate ? scenario.contribution_growth_rate * 100 : 0.0);
  }, [scenario.id, scenario.monthly_expenses_retirement, scenario.monthly_contribution, scenario.currency]);

  // Debounced live calculation trigger
  const triggerLiveCalc = (newVals: {
    expenses?: number;
    goalAge?: number;
    contribution?: number;
    swr?: number;
    annualReturn?: number;
    inflation?: number;
    taxRate?: number;
    growthRate?: number;
  }) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onLiveCalculate({
        monthly_expenses_retirement: newVals.expenses ?? expenses,
        retirement_age_goal: newVals.goalAge ?? goalAge,
        monthly_contribution: newVals.contribution ?? contribution,
        swr: (newVals.swr ?? swr) / 100.0,
        expected_annual_return: (newVals.annualReturn ?? annualReturn) / 100.0,
        inflation: (newVals.inflation ?? inflation) / 100.0,
        tax_rate_retirement: (newVals.taxRate ?? taxRate) / 100.0,
        contribution_growth_rate: (newVals.growthRate ?? growthRate) / 100.0,
      });
    }, 250);
  };

  const handleReset = () => {
    const defaultExpenses = Number(scenario.monthly_expenses_retirement) || 50000;
    const defaultGoalAge = scenario.retirement_age_goal || 55;
    const defaultContribution = Number(scenario.monthly_contribution) || 25000;
    const defaultSwr = scenario.swr ? scenario.swr * 100 : 4.0;
    const defaultReturn = scenario.expected_annual_return ? scenario.expected_annual_return * 100 : 10.0;
    const defaultInflation = scenario.inflation ? scenario.inflation * 100 : 6.0;
    const defaultTaxRate = scenario.tax_rate_retirement ? scenario.tax_rate_retirement * 100 : 15.0;
    const defaultGrowthRate = scenario.contribution_growth_rate ? scenario.contribution_growth_rate * 100 : 0.0;

    setExpenses(defaultExpenses);
    setGoalAge(defaultGoalAge);
    setContribution(defaultContribution);
    setSwr(defaultSwr);
    setAnnualReturn(defaultReturn);
    setInflation(defaultInflation);
    setTaxRate(defaultTaxRate);
    setGrowthRate(defaultGrowthRate);

    triggerLiveCalc({
      expenses: defaultExpenses,
      goalAge: defaultGoalAge,
      contribution: defaultContribution,
      swr: defaultSwr,
      annualReturn: defaultReturn,
      inflation: defaultInflation,
      taxRate: defaultTaxRate,
      growthRate: defaultGrowthRate,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      monthly_expenses_retirement: expenses,
      retirement_age_goal: goalAge,
      monthly_contribution: contribution,
      swr: swr / 100.0,
      expected_annual_return: annualReturn / 100.0,
      inflation: inflation / 100.0,
      tax_rate_retirement: taxRate / 100.0,
      contribution_growth_rate: growthRate / 100.0,
      currency: baseCurrency,
    });
  };

  return (
    <form onSubmit={handleSave} className="rounded-[32px] ios-glass-card p-6 sm:p-8 shadow-ios-card space-y-6">
      {/* Card Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl ios-icon-box ios-icon-box-pink shrink-0">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{COPY.FIRE_FORM.SECTION_TITLE}</h3>
            <p className="text-xs text-slate-400">
              {COPY.FIRE_FORM.SECTION_DESC}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition inline-flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{COPY.FIRE_FORM.RESET}</span>
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white ios-btn-primary shadow-glass-glow transition inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? COPY.COMMON.SAVING : COPY.FIRE_FORM.SAVE_CHANGES}</span>
          </button>
        </div>
      </div>

      {/* Grid of Assumptions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Expenses in Retirement */}
        <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-white/12 transition-colors space-y-3">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
              <label className="font-semibold text-slate-200">{COPY.FIRE_FORM.MONTHLY_EXPENSES}</label>
            </div>
            <span className="font-mono font-bold text-white">
              {currencySymbol}{formatCurrencyAmount(expenses, baseCurrency, 0)}
            </span>
          </div>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400 font-mono text-sm pointer-events-none">
              {currencySymbol}
            </span>
            <input
              type="number"
              min="0"
              step={baseCurrency === "INR" ? "1000" : "50"}
              value={expenses}
              onChange={(e) => {
                const val = Math.max(0, Number(e.target.value));
                setExpenses(val);
                triggerLiveCalc({ expenses: val });
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl ios-glass-input text-white font-mono text-sm focus:outline-none"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>Annual: {currencySymbol}{formatCurrencyAmount(expenses * 12, baseCurrency, 0)}</span>
            <span>Target base expenses</span>
          </div>
        </div>

        {/* Current Monthly Contribution */}
        <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-white/12 transition-colors space-y-3">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <label className="font-semibold text-slate-200">{COPY.FIRE_FORM.MONTHLY_CONTRIBUTION}</label>
            </div>
            <span className="font-mono font-bold text-emerald-400">
              {currencySymbol}{formatCurrencyAmount(contribution, baseCurrency, 0)}
            </span>
          </div>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400 font-mono text-sm pointer-events-none">
              {currencySymbol}
            </span>
            <input
              type="number"
              min="0"
              step={baseCurrency === "INR" ? "1000" : "50"}
              value={contribution}
              onChange={(e) => {
                const val = Math.max(0, Number(e.target.value));
                setContribution(val);
                triggerLiveCalc({ contribution: val });
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl ios-glass-input text-white font-mono text-sm focus:outline-none"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>Annual: {currencySymbol}{formatCurrencyAmount(contribution * 12, baseCurrency, 0)}</span>
            <span>Invested monthly</span>
          </div>
        </div>

        {/* Retirement Age Goal */}
        <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-white/12 transition-colors space-y-3">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <label className="font-semibold text-slate-200">{COPY.FIRE_FORM.TARGET_AGE}</label>
            </div>
            <span className="font-mono font-bold text-cyan-400">Age {goalAge}</span>
          </div>
          <GlassSlider
            min={30}
            max={75}
            step={1}
            value={goalAge}
            color="cyan"
            unit="yrs"
            ariaLabel="Retirement Age Goal"
            onChange={(val) => {
              setGoalAge(val);
              triggerLiveCalc({ goalAge: val });
            }}
          />
        </div>

        {/* Safe Withdrawal Rate (SWR) */}
        <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-white/12 transition-colors space-y-3">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              <div className="flex items-center gap-1.5">
                <label className="font-semibold text-slate-200">{COPY.FIRE_FORM.SWR}</label>
                <span
                  title="Standard rule of thumb is 4.0% (Trinity Study). Lower rate (e.g. 3.5%) is more conservative."
                  className="cursor-help text-slate-500 hover:text-slate-300 transition"
                >
                  <HelpCircle className="h-3 w-3" />
                </span>
              </div>
            </div>
            <span className="font-mono font-bold text-amber-300">{formatPercent(swr, 2)}</span>
          </div>
          <GlassSlider
            min={2.0}
            max={6.0}
            step={0.1}
            value={swr}
            color="amber"
            unit="%"
            ariaLabel="Safe Withdrawal Rate"
            onChange={(val) => {
              setSwr(val);
              triggerLiveCalc({ swr: val });
            }}
          />
        </div>

        {/* Expected Annual Return */}
        <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-white/12 transition-colors space-y-3">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
              <label className="font-semibold text-slate-200">{COPY.FIRE_FORM.ANNUAL_RETURN}</label>
            </div>
            <span className="font-mono font-bold text-pink-400">{formatPercent(annualReturn, 1)}</span>
          </div>
          <GlassSlider
            min={4.0}
            max={18.0}
            step={0.5}
            value={annualReturn}
            color="pink"
            unit="%"
            ariaLabel="Expected Annual Return"
            onChange={(val) => {
              setAnnualReturn(val);
              triggerLiveCalc({ annualReturn: val });
            }}
          />
        </div>

        {/* Expected Annual Inflation */}
        <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-white/12 transition-colors space-y-3">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.7)]" />
              <label className="font-semibold text-slate-200">{COPY.FIRE_FORM.INFLATION}</label>
            </div>
            <span className="font-mono font-bold text-slate-300">{formatPercent(inflation, 1)}</span>
          </div>
          <GlassSlider
            min={1.0}
            max={12.0}
            step={0.5}
            value={inflation}
            color="slate"
            unit="%"
            ariaLabel="Expected Annual Inflation"
            onChange={(val) => {
              setInflation(val);
              triggerLiveCalc({ inflation: val });
            }}
          />
        </div>

        {/* Estimated Tax Rate in Retirement */}
        <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-white/12 transition-colors space-y-3">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              <label className="font-semibold text-slate-200">{COPY.FIRE_FORM.TAX_RATE}</label>
            </div>
            <span className="font-mono font-bold text-purple-300">{formatPercent(taxRate, 1)}</span>
          </div>
          <GlassSlider
            min={0.0}
            max={35.0}
            step={1.0}
            value={taxRate}
            color="purple"
            unit="%"
            ariaLabel="Retirement Tax Rate"
            onChange={(val) => {
              setTaxRate(val);
              triggerLiveCalc({ taxRate: val });
            }}
          />
        </div>

        {/* Yearly Contribution Step-Up */}
        <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-white/12 transition-colors space-y-3">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <label className="font-semibold text-slate-200">{COPY.FIRE_FORM.GROWTH_RATE}</label>
            </div>
            <span className="font-mono font-bold text-emerald-300">{formatPercent(growthRate, 1)}</span>
          </div>
          <GlassSlider
            min={0.0}
            max={15.0}
            step={0.5}
            value={growthRate}
            color="emerald"
            unit="%"
            ariaLabel="Yearly Contribution Step-Up"
            onChange={(val) => {
              setGrowthRate(val);
              triggerLiveCalc({ growthRate: val });
            }}
          />
        </div>
      </div>
    </form>
  );
};
