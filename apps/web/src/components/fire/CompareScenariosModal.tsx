"use client";

import React, { useState, useEffect } from "react";
import { FireScenario, FireScenarioSummary } from "@/types";
import { formatCurrencyAmount } from "@/lib/format";
import { api } from "@/lib/api";
import { Layers, Check } from "lucide-react";
import { GlassModal } from "@/components/ui/GlassModal";

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
    if (baseCurrency === "INR") {
      if (num >= 10000000) return `${currencySymbol}${(num / 10000000).toFixed(2)} Cr`;
      if (num >= 100000) return `${currencySymbol}${(num / 100000).toFixed(2)} L`;
    }
    if (num >= 1000 && baseCurrency !== "INR") return `${currencySymbol}${(num / 1000).toFixed(1)}k`;
    return `${currencySymbol}${formatCurrencyAmount(num, baseCurrency, 0)}`;
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Compare FIRE Scenarios"
      description="Select 2 to 4 scenarios to evaluate timelines and targets side by side"
      icon={<Layers className="h-5 w-5" />}
      iconColor="pink"
      maxWidth="4xl"
      footer={
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white ios-btn-secondary transition"
        >
          Close
        </button>
      }
    >
      <div className="space-y-4">
        {/* Scenario Selection Chips */}
        <div className="flex flex-wrap items-center gap-2 pb-2 shrink-0">
          <span className="text-xs text-slate-400 mr-1">Compare:</span>
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
            <span>Loading scenario metrics...</span>
          </div>
        ) : comparedData.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Please select at least one scenario to view comparisons.
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
                  <td className="py-3 px-4 font-medium text-slate-400">Projected FI Age</td>
                  {comparedData.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-bold text-cyan-400 font-mono">
                      {sc.metrics.full_fi_age ? `Age ${sc.metrics.full_fi_age}` : "Unattainable"}
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
                      {(sc.swr * 100).toFixed(2)}%
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Annual Return Expected</td>
                  {comparedData.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-mono">
                      {(sc.expected_annual_return * 100).toFixed(1)}%
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Expected Inflation</td>
                  {comparedData.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-mono">
                      {(sc.inflation * 100).toFixed(1)}%
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Coast FI Attained?</td>
                  {comparedData.map((sc) => (
                    <td key={sc.id} className="py-3 px-4">
                      {sc.metrics.is_coast_fi_achieved ? (
                        <span className="ios-badge ios-badge-emerald text-[10px]">
                          Attained
                        </span>
                      ) : (
                        <span className="ios-badge ios-badge-rose text-[10px]">
                          Pending
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Real Return Rate</td>
                  {comparedData.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-mono">
                      {sc.metrics.real_return_rate.toFixed(2)}%
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
