"use client";

import React, { useState, useEffect } from "react";
import { FireScenario, FireScenarioSummary } from "@/types";
import { formatCurrencyAmount, formatCompactCurrency, formatPercent, formatMonthYear } from "@/lib/format";
import { api } from "@/lib/api";
import { Layers, Check } from "lucide-react";
import { GlassModal } from "@/components/ui/GlassModal";
import { COPY } from "@/constants/copy";

interface CompareScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableScenarios: FireScenarioSummary[];
  currencySymbol: string;
  baseCurrency?: string;
}

export const CompareScenariosModal: React.FC<CompareScenariosModalProps> = ({
  isOpen,
  onClose,
  availableScenarios,
  currencySymbol,
  baseCurrency = "INR",
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparedData, setComparedData] = useState<FireScenario[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && availableScenarios.length > 0) {
      // Pick first 2 by default
      const initial = availableScenarios.slice(0, Math.min(3, availableScenarios.length)).map((s) => s.id);
      setSelectedIds(initial);
      fetchComparison(initial);
    }
  }, [isOpen]);

  const fetchComparison = async (ids: string[]) => {
    if (ids.length === 0) {
      setComparedData([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.compareFireScenarios(ids);
      setComparedData(res.scenarios || []);
    } catch {
      setComparedData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleScenario = (id: string) => {
    let next: string[];
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 1) return; // Keep at least one
      next = selectedIds.filter((x) => x !== id);
    } else {
      if (selectedIds.length >= 4) return; // Limit to 4 for readability
      next = [...selectedIds, id];
    }
    setSelectedIds(next);
    fetchComparison(next);
  };

  const formatCurrency = (val: number | string) => {
    const num = Number(val);
    if (isNaN(num)) return `${currencySymbol}0`;
    if (Math.abs(num) >= 1e4) {
      return `${currencySymbol}${formatCompactCurrency(num, baseCurrency).compact}`;
    }
    return `${currencySymbol}${formatCurrencyAmount(num, baseCurrency, 0)}`;
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={COPY.FIRE.COMPARE_TITLE}
      description={COPY.FIRE.COMPARE_DESC}
      icon={<Layers className="h-5 w-5" />}
      iconColor="pink"
      maxWidth="4xl"
      footer={
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white ios-btn-secondary transition"
        >
          {COPY.COMMON.CLOSE}
        </button>
      }
    >
      <div className="space-y-4">
        {/* Scenario Selection Chips */}
        <div className="flex flex-wrap items-center gap-2 pb-2 shrink-0">
          <span className="text-xs text-slate-400 mr-1">{COPY.FIRE.COMPARE_PLANS}:</span>
          {availableScenarios.map((sc) => {
            const isSelected = selectedIds.includes(sc.id);
            return (
              <button
                key={sc.id}
                onClick={() => toggleScenario(sc.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-pink-500/20 text-pink-200 border border-pink-500/35 shadow-sm"
                    : "bg-white/[0.04] text-slate-400 border border-white/10 hover:text-white"
                }`}
              >
                {isSelected && <Check className="h-3 w-3 text-pink-400" />}
                <span>{sc.name}</span>
                {sc.is_default && <span className="text-[10px] text-amber-300">⭐</span>}
              </button>
            );
          })}
        </div>

        {/* Comparison Table */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <span>{COPY.FIRE.COMPARE_LOADING}</span>
          </div>
        ) : comparedData.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {COPY.FIRE.COMPARE_EMPTY}
          </div>
        ) : (
          <div className="flex-1 overflow-auto rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.04]">
                  <th className="py-3 px-4 font-bold text-slate-300 w-44">Metric</th>
                  {comparedData.map((sc) => (
                    <th key={sc.id} className="py-3 px-4 font-bold text-white min-w-[160px]">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{sc.name}</span>
                        {sc.is_default && <span className="text-[10px] text-amber-300">⭐</span>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-200">
                {/* 1. Target & Age */}
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Real FI Target</td>
                  {comparedData.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-bold text-pink-400 font-mono">
                      {formatCurrency(sc.metrics.real_full_fi_target)}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Projected FI Timeline</td>
                  {comparedData.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-bold text-cyan-400 font-mono">
                      {sc.metrics.full_fi_age ? `Age ${sc.metrics.full_fi_age}` : COPY.FIRE.COMPARE_UNATTAINABLE}
                      {sc.metrics.full_fi_year && (
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {formatMonthYear(sc.metrics.full_fi_year, sc.metrics.full_fi_month)}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Goal Age Target</td>
                  {comparedData.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-mono">
                      Age {sc.retirement_age_goal || 55}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Monthly Contribution</td>
                  {comparedData.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-mono text-emerald-400">
                      {formatCurrency(sc.monthly_contribution)}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Retirement Monthly Exp.</td>
                  {comparedData.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-mono">
                      {formatCurrency(sc.monthly_expenses_retirement)}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Safe Withdrawal Rate</td>
                  {comparedData.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-mono text-amber-300">
                      {formatPercent(sc.swr * 100, 2, { floor: true })}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Annual Return Expected</td>
                  {comparedData.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-mono">
                      {formatPercent(sc.expected_annual_return * 100, 1, { floor: true })}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Expected Inflation</td>
                  {comparedData.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-mono">
                      {formatPercent(sc.inflation * 100, 1, { floor: true })}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Coast FI Timeline</td>
                  {comparedData.map((sc) => (
                    <td key={sc.id} className="py-3 px-4">
                      {sc.metrics.is_coast_fi_achieved ? (
                        <div className="space-y-0.5">
                          <span className="ios-badge ios-badge-emerald text-[10px]">
                            {COPY.FIRE.COMPARE_ATTAINED}
                          </span>
                          {sc.metrics.coast_fi_year && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              {formatMonthYear(sc.metrics.coast_fi_year, sc.metrics.coast_fi_month)}
                            </span>
                          )}
                        </div>
                      ) : sc.metrics.coast_fi_year ? (
                        <div className="space-y-0.5">
                          <span className="text-purple-300 font-mono text-xs font-semibold">
                            {formatMonthYear(sc.metrics.coast_fi_year, sc.metrics.coast_fi_month)}
                          </span>
                          {sc.metrics.coast_fi_age && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              Age {sc.metrics.coast_fi_age}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="ios-badge ios-badge-rose text-[10px]">
                          {COPY.FIRE.COMPARE_PENDING}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Real Return Rate</td>
                  {comparedData.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-mono">
                      {formatPercent(sc.metrics.real_return_rate, 2, { floor: true })}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </GlassModal>
  );
};
