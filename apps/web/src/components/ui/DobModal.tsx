"use client";

import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { GlassModal } from "@/components/ui/GlassModal";
import { COPY } from "@/constants/copy";

interface DobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dob: string) => Promise<void>;
  initialDob?: string | null;
}

const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export const DobModal: React.FC<DobModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDob,
}) => {
  const [day, setDay] = useState("15");
  const [month, setMonth] = useState("06");
  const [year, setYear] = useState("1995");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialDob && initialDob.includes("-")) {
      const parts = initialDob.trim().split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          setYear(parts[0]);
          setMonth(parts[1].padStart(2, "0"));
          setDay(parts[2].padStart(2, "0"));
        } else if (parts[2].length === 4) {
          // DD-MM-YYYY
          setDay(parts[0].padStart(2, "0"));
          setMonth(parts[1].padStart(2, "0"));
          setYear(parts[2]);
        }
      }
    } else {
      // Default around 30 years ago
      const currentYear = new Date().getFullYear();
      setYear(String(currentYear - 30));
      setMonth("06");
      setDay("15");
    }
    setError(null);
  }, [initialDob, isOpen]);

  // Generate Year options from current year down to 1940
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= 1940; y--) {
    yearOptions.push({ value: String(y), label: String(y) });
  }

  // Days in selected month & year
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
  const dayOptions = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const val = String(d).padStart(2, "0");
    dayOptions.push({ value: val, label: val });
  }

  // Calculate age preview
  const calculateAge = () => {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10) - 1;
    const d = parseInt(day, 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

    const birthDate = new Date(y, m, d);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const mDiff = today.getMonth() - birthDate.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculatedAge = calculateAge();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(formattedDate);
      onClose();
    } catch (err: any) {
      setError(err.message || COPY.DOB.ERROR_DEFAULT);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={COPY.DOB.TITLE}
      description={COPY.DOB.DESC}
      icon={<Calendar className="h-5 w-5" />}
      iconColor="pink"
      maxWidth="lg"
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
            form="dob-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-2xl ios-btn-primary text-sm shadow-glass-glow disabled:opacity-50"
          >
            {isSubmitting ? COPY.COMMON.SAVING : COPY.DOB.SAVE}
          </button>
        </>
      }
    >
      <form id="dob-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Glass Selectors for Day, Month, Year */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Day */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {COPY.DOB.DAY}
            </label>
            <GlassSelect
              value={day}
              onChange={setDay}
              options={dayOptions}
              searchable={true}
            />
          </div>

          {/* Month */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {COPY.DOB.MONTH}
            </label>
            <GlassSelect
              value={month}
              onChange={setMonth}
              options={MONTH_OPTIONS}
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {COPY.DOB.YEAR}
            </label>
            <GlassSelect
              value={year}
              onChange={setYear}
              options={yearOptions}
              searchable={true}
            />
          </div>
        </div>

        {/* Age Indicator Callout */}
        {calculatedAge !== null && (
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs">
            <span className="text-slate-400">{COPY.DOB.CALCULATED_AGE}</span>
            <span className="font-mono font-bold text-white bg-pink-500/20 px-2.5 py-0.5 rounded-full border border-pink-500/30 text-pink-300">
              {calculatedAge} {COPY.DOB.YEARS_OLD}
            </span>
          </div>
        )}
      </form>
    </GlassModal>
  );
};
