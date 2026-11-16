"use client";

import React, { useState, useEffect } from "react";
import { User, FireScenario, FireScenarioSummary } from "@/types";
import { api } from "@/lib/api";
import { FireProgressCards } from "./FireProgressCards";
import { FireKpiCards } from "./FireKpiCards";
import { FireTrajectoryChart } from "./FireTrajectoryChart";
import { FireInputForm } from "./FireInputForm";
import { NewScenarioModal } from "./NewScenarioModal";
import { CompareScenariosModal } from "./CompareScenariosModal";
import { GlassDatePicker } from "@/components/ui/GlassDatePicker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { GlassEmptyState } from "@/components/ui/GlassEmptyState";
import { formatCompactCurrency, formatDob } from "@/lib/format";
import { COPY } from "@/constants/copy";
import {
  Flame,
  Plus,
  Layers,
  Star,
  Trash2,
  Calendar,
  Info,
  ChevronDown,
  Loader2,
} from "lucide-react";

interface FireViewProps {
  user: User | null;
  baseCurrency: string;
  currencySymbol: string;
  onUserUpdated?: (updated: User) => void;
  onScenarioUpdated?: () => void;
}

export const FireView: React.FC<FireViewProps> = ({
  user,
  baseCurrency,
  currencySymbol,
  onUserUpdated,
  onScenarioUpdated,
}) => {
  const [scenarios, setScenarios] = useState<FireScenarioSummary[]>([]);
  const [activeScenario, setActiveScenario] = useState<FireScenario | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingScenario, setIsDeletingScenario] = useState(false);

  useEffect(() => {
    loadScenarios();
  }, [baseCurrency]);

  const loadScenarios = async (selectedId?: string) => {
    setIsLoading(true);
    try {
      const list = await api.getFireScenarios();
      setScenarios(list || []);

      if (list && list.length > 0) {
        // Pick specified, or primary/default, or first
        const targetId =
          selectedId || list.find((s) => s.is_default)?.id || list[0].id;
        const full = await api.getFireScenario(targetId);
        setActiveScenario(full);
      } else {
        setActiveScenario(null);
      }
    } catch {
      // Failed to load scenarios
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectScenario = async (id: string) => {
    setIsLoading(true);
    try {
      const full = await api.getFireScenario(id);
      setActiveScenario(full);
    } catch {
      // Failed to load scenario details
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveScenario = async (updatedValues: Partial<FireScenario>) => {
    if (!activeScenario) return;
    setIsSaving(true);
    try {
      const updated = await api.updateFireScenario(activeScenario.id, updatedValues);
      setActiveScenario(updated);
      // Refresh summary list
      const list = await api.getFireScenarios();
      setScenarios(list || []);
      onScenarioUpdated?.();
    } catch (err: any) {
      alert(err.message || "Failed to save scenario changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLiveCalculate = async (values: any) => {
    if (!activeScenario) return;
    try {
      const scratchpad = await api.calculateFire({
        dob: user?.dob,
        monthly_expenses_retirement: values.monthly_expenses_retirement,
        retirement_age_goal: values.retirement_age_goal,
        monthly_contribution: values.monthly_contribution,
        swr: values.swr,
        expected_annual_return: values.expected_annual_return,
        inflation: values.inflation,
        tax_rate_retirement: values.tax_rate_retirement,
        contribution_growth_rate: values.contribution_growth_rate,
      });

      // Update active scenario preview state without saving to DB
      setActiveScenario((prev) =>
        prev
          ? {
              ...prev,
              ...values,
              metrics: scratchpad.metrics,
              trajectory: scratchpad.trajectory,
            }
          : null
      );
    } catch {
      // Ignore background calculation errors
    }
  };

  const handleSetDefault = async () => {
    if (!activeScenario || activeScenario.is_default) return;
    try {
      await api.setDefaultFireScenario(activeScenario.id);
      await loadScenarios(activeScenario.id);
      onScenarioUpdated?.();
    } catch (err: any) {
      alert(err.message || "Failed to set default plan");
    }
  };

  const handleDeleteScenario = () => {
    if (!activeScenario) return;
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteScenario = async () => {
    if (!activeScenario) return;
    setIsDeletingScenario(true);
    try {
      await api.deleteFireScenario(activeScenario.id);
      setIsDeleteModalOpen(false);
      await loadScenarios();
      onScenarioUpdated?.();
    } catch (err: any) {
      alert(err.message || "Failed to delete scenario");
    } finally {
      setIsDeletingScenario(false);
    }
  };

  const handleSaveDob = async (formattedDob: string) => {
    try {
      const updatedUser = await api.updateUserProfile({ dob: formattedDob });
      if (onUserUpdated) onUserUpdated(updatedUser);
      if (activeScenario) {
        await loadScenarios(activeScenario.id);
      }
    } catch (err: any) {
      alert(err.message || "Failed to save Date of Birth");
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl ios-icon-box ios-icon-box-pink shadow-glass-glow">
              <Flame className="h-5 w-5 fill-pink-500/20" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                FIRE Goal Planner
              </h1>
              <p className="text-xs text-slate-400">
                Calculate your financial independence timeline, targets, and compounding milestones
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {scenarios.length > 1 && (
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white ios-btn-secondary inline-flex items-center gap-1.5"
            >
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>{COPY.FIRE.COMPARE_PLANS}</span>
            </button>
          )}

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 rounded-2xl text-xs font-bold text-white ios-btn-primary shadow-glass-glow transition inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4 stroke-[2.8]" />
            <span>{COPY.FIRE.NEW_SCENARIO}</span>
          </button>
        </div>
      </div>

      {/* Date of Birth Setup Banner */}
      {!user?.dob && (
        <div className="ios-callout-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl ios-icon-box ios-icon-box-pink shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                {COPY.FIRE.DOB_BANNER_TITLE}
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {COPY.FIRE.DOB_BANNER_DESC}
              </p>
            </div>
          </div>
          <GlassDatePicker
            value={user?.dob}
            onChange={handleSaveDob}
            variant="button"
            maxDate={new Date().toISOString().split("T")[0]}
            menuAlign="right"
            renderTrigger={({ isOpen, toggle, isSaving }) => (
              <button
                type="button"
                onClick={toggle}
                disabled={isSaving}
                className={`px-4 py-2 rounded-2xl text-xs font-bold text-white ios-btn-primary shadow-glass-glow flex items-center gap-1.5 shrink-0 transition select-none cursor-pointer ${
                  isOpen ? "ring-2 ring-pink-500/50" : ""
                } ${isSaving ? "opacity-60" : ""}`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>{isSaving ? COPY.COMMON.SAVING : COPY.FIRE.SET_DOB}</span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          />
        </div>
      )}

      {/* Liquid Assets & DOB Transparency Callout */}
      {activeScenario && (
        <div className="ios-callout-info flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              {COPY.FIRE.CURRENT_LIQUID_PORTFOLIO}:{" "}
              <strong className="text-white font-bold">
                {currencySymbol}
                {formatCompactCurrency(Number(activeScenario.metrics.current_liquid_portfolio), baseCurrency).compact}
              </strong>
              {formatCompactCurrency(Number(activeScenario.metrics.current_liquid_portfolio), baseCurrency).compact !==
                formatCompactCurrency(Number(activeScenario.metrics.current_liquid_portfolio), baseCurrency).full && (
                <span className="text-slate-400 font-mono text-[11px] ml-1">
                  ({currencySymbol}{formatCompactCurrency(Number(activeScenario.metrics.current_liquid_portfolio), baseCurrency).full})
                </span>
              )}{" "}
              (Automatically aggregated from liquid assets only; physical real estate & vehicles are excluded).
            </span>
          </div>
          <GlassDatePicker
            value={user?.dob}
            onChange={handleSaveDob}
            variant="pill"
            maxDate={new Date().toISOString().split("T")[0]}
            placeholder={COPY.FIRE.SET_DOB}
            label={COPY.FIRE.DOB_LABEL}
            menuAlign="right"
          />
        </div>
      )}

      {/* Scenario Selector & Header Controls */}
      {scenarios.length > 0 && activeScenario && (
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl ios-glass">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">{COPY.FIRE.ACTIVE_SCENARIO}</span>
            <GlassSelect
              value={activeScenario.id}
              onChange={handleSelectScenario}
              options={scenarios.map((s) => ({
                value: s.id,
                label: `${s.name}${s.is_default ? " ⭐ (Primary)" : ""}`,
              }))}
              variant="pill"
            />

            {activeScenario.is_default ? (
              <span className="ios-badge ios-badge-pink text-[10px]">
                <Star className="h-2.5 w-2.5 fill-pink-400 text-pink-400" />
                <span>{COPY.FIRE.PRIMARY_PLAN}</span>
              </span>
            ) : (
              <button
                onClick={handleSetDefault}
                className="text-[11px] font-medium text-slate-400 hover:text-pink-300 transition underline underline-offset-2"
              >
                Set as Primary
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteScenario}
              className="ios-action-btn-danger"
              title="Delete this scenario"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          <span className="text-xs">Computing FIRE models and trajectory...</span>
        </div>
      ) : scenarios.length === 0 ? (
        <GlassEmptyState
          variant="welcome"
          icon={<Flame className="h-8 w-8 fill-pink-500/20" />}
          iconColor="pink"
          title={COPY.FIRE.EMPTY_TITLE}
          description={COPY.FIRE.EMPTY_DESC}
          action={
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-white ios-btn-primary shadow-glass-glow inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4 stroke-[2.8]" />
              <span>{COPY.FIRE.EMPTY_BTN}</span>
            </button>
          }
        />
      ) : activeScenario ? (
        /* Active Scenario Dashboards */
        <div className="relative z-10 space-y-6 animate-in fade-in duration-300">
          {/* Progress Bars: Full FI & Coast FI */}
          <FireProgressCards
            metrics={activeScenario.metrics}
            swr={activeScenario.swr}
            currencySymbol={currencySymbol}
            baseCurrency={baseCurrency}
            goalAge={activeScenario.retirement_age_goal}
          />

          {/* Top KPI Summary Cards */}
          <FireKpiCards
            metrics={activeScenario.metrics}
            currencySymbol={currencySymbol}
            baseCurrency={baseCurrency}
            goalAge={activeScenario.retirement_age_goal}
          />

          {/* Interactive Projection Chart */}
          <FireTrajectoryChart
            trajectory={activeScenario.trajectory}
            currencySymbol={currencySymbol}
            baseCurrency={baseCurrency}
            currentAge={activeScenario.metrics.current_age}
            goalAge={activeScenario.retirement_age_goal}
            fullFiAge={activeScenario.metrics.full_fi_age}
          />

          {/* Interactive Assumption Sliders & Inputs */}
          <FireInputForm
            scenario={activeScenario}
            currencySymbol={currencySymbol}
            baseCurrency={baseCurrency}
            isSaving={isSaving}
            onSave={handleSaveScenario}
            onLiveCalculate={handleLiveCalculate}
          />
        </div>
      ) : null}


      {/* New Scenario Modal */}
      <NewScenarioModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={async (data) => {
          const created = await api.createFireScenario(data);
          await loadScenarios(created.id);
          onScenarioUpdated?.();
        }}
        currencySymbol={currencySymbol}
        baseCurrency={baseCurrency}
      />

      {/* Compare Scenarios Modal */}
      <CompareScenariosModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        availableScenarios={scenarios}
        currencySymbol={currencySymbol}
        baseCurrency={baseCurrency}
      />

      {/* Delete Scenario Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteScenario}
        title="Delete FIRE Plan"
        description={`Are you sure you want to delete "${activeScenario?.name}"? All custom retirement assumptions and compounding milestones for this plan will be permanently removed.`}
        confirmText="Delete Plan"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeletingScenario}
      />
    </div>
  );
};
