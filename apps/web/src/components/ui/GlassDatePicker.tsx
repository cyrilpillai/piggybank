"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";
import { formatDob } from "@/lib/format";

export interface GlassDatePickerProps {
  value?: string | null; // Format: "YYYY-MM-DD"
  onChange: (date: string) => void | Promise<void>;
  placeholder?: string;
  variant?: "input" | "pill" | "button";
  className?: string;
  disabled?: boolean;
  minDate?: string; // "YYYY-MM-DD"
  maxDate?: string; // "YYYY-MM-DD"
  menuPlacement?: "bottom" | "top";
  menuAlign?: "left" | "right";
  clearable?: boolean;
  autoClose?: boolean;
  label?: string;
  displayFormat?: (dateStr: string) => string;
  renderTrigger?: (props: {
    value: string | null;
    displayValue: string;
    isOpen: boolean;
    toggle: () => void;
    isSaving: boolean;
  }) => React.ReactNode;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Safely parse a date string (YYYY-MM-DD or DD-MM-YYYY) into components
 * to avoid UTC / local timezone offset shifting.
 */
function parseDateParts(str?: string | null): { year: number; month: number; day: number } | null {
  if (!str) return null;
  const parts = str.trim().split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return { year: y, month: m, day: d };
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return { year: y, month: m, day: d };
    }
  }
  return null;
}

/**
 * Format year, month, day to "YYYY-MM-DD"
 */
function toIsoDate(year: number, month: number, day: number): string {
  const y = String(year);
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const GlassDatePicker: React.FC<GlassDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  variant = "input",
  className = "",
  disabled = false,
  minDate = "1920-01-01",
  maxDate,
  menuPlacement = "bottom",
  menuAlign = "left",
  clearable = false,
  autoClose = true,
  label,
  displayFormat,
  renderTrigger,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const activeYearRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse current value
  const parsedValue = useMemo(() => parseDateParts(value), [value]);

  // Today reference
  const today = useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
  }, []);

  // View state for navigating calendar
  const [viewYear, setViewYear] = useState<number>(() => {
    if (parsedValue) return parsedValue.year;
    return today.year;
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (parsedValue) return parsedValue.month;
    return today.month;
  });

  // Keep view in sync when value changes externally or menu opens
  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
    } else {
      setViewYear(today.year);
      setViewMonth(today.month);
    }
    setViewMode("days");
  }, [value, isOpen, parsedValue, today.year, today.month]);

  // Format display text
  const displayValue = useMemo(() => {
    if (!value) return "";
    if (displayFormat) return displayFormat(value);
    return formatDob(value);
  }, [value, displayFormat]);

  // Dynamic positioning for floating liquid glass sheet
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    if (rect.width === 0 && rect.height === 0) return;

    const menuHeight = menuRef.current?.offsetHeight || 320;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement = menuPlacement;
    if (menuPlacement === "bottom") {
      if (spaceBelow < Math.min(menuHeight, 340) && spaceAbove > spaceBelow) {
        placement = "top";
      }
    } else if (menuPlacement === "top") {
      if (spaceAbove < Math.min(menuHeight, 340) && spaceBelow > spaceAbove) {
        placement = "bottom";
      }
    }

    const style: React.CSSProperties = {
      position: "fixed",
      zIndex: 99999,
    };

    if (placement === "top") {
      style.bottom = `${Math.max(8, viewportHeight - rect.top + 8)}px`;
    } else {
      style.top = `${Math.min(viewportHeight - 60, rect.bottom + 8)}px`;
    }

    const pickerWidth = 316;
    if (menuAlign === "right") {
      const rightSpace = viewportWidth - rect.right;
      if (rect.right < pickerWidth && spaceBelow > 0) {
        style.left = `${Math.max(12, rect.left)}px`;
      } else {
        style.right = `${Math.max(12, Math.min(rightSpace, viewportWidth - pickerWidth - 12))}px`;
      }
    } else {
      style.left = `${Math.max(12, Math.min(rect.left, viewportWidth - pickerWidth - 12))}px`;
    }

    setMenuStyle(style);
  }, [menuPlacement, menuAlign]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => updatePosition();
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Outside click & escape handlers
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!menuRef.current || !menuRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Scroll active year into view when entering year mode
  useEffect(() => {
    if (viewMode === "years" && activeYearRef.current) {
      activeYearRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [viewMode]);

  // Min & max date limits
  const parsedMin = useMemo(() => parseDateParts(minDate), [minDate]);
  const parsedMax = useMemo(() => parseDateParts(maxDate), [maxDate]);

  const isDateDisabled = useCallback(
    (year: number, month: number, day: number) => {
      const dateVal = year * 10000 + month * 100 + day;
      if (parsedMin) {
        const minVal = parsedMin.year * 10000 + parsedMin.month * 100 + parsedMin.day;
        if (dateVal < minVal) return true;
      }
      if (parsedMax) {
        const maxVal = parsedMax.year * 10000 + parsedMax.month * 100 + parsedMax.day;
        if (dateVal > maxVal) return true;
      }
      return false;
    },
    [parsedMin, parsedMax]
  );

  // Handle date click
  const handleSelectDate = async (year: number, month: number, day: number) => {
    if (isDateDisabled(year, month, day) || isSaving) return;
    const formatted = toIsoDate(year, month, day);

    try {
      const result = onChange(formatted);
      if (result instanceof Promise) {
        setIsSaving(true);
        await result;
      }
      if (autoClose) {
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Failed to select date:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Clear date
  const handleClear = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaving) return;
    try {
      const result = onChange("");
      if (result instanceof Promise) {
        setIsSaving(true);
        await result;
      }
      if (autoClose) {
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Failed to clear date:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Days in month calculation
  const daysInCurrentMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0 = Sunday

  // Year options generation (minDate to maxDate or default range 1920 - today + 30)
  const minYear = parsedMin ? parsedMin.year : 1920;
  const maxYear = parsedMax ? parsedMax.year : today.year + 30;
  const yearList = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  const isPill = variant === "pill";
  const isButton = variant === "button";

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${!isPill && !isButton ? "w-full" : ""} ${
        isOpen ? "z-50" : "z-auto"
      } ${className}`}
    >
      {/* Trigger Button or Custom Render Trigger */}
      {renderTrigger ? (
        renderTrigger({
          value: value || null,
          displayValue,
          isOpen,
          toggle: () => !disabled && setIsOpen(!isOpen),
          isSaving,
        })
      ) : (
        <button
          type="button"
          disabled={disabled || isSaving}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className={`flex items-center justify-between text-left transition-all duration-200 select-none ${
            isPill
              ? "ios-glass-pill rounded-full px-3.5 py-1.5 text-xs text-slate-200 hover:text-white"
              : isButton
              ? "px-4 py-2 rounded-2xl text-xs font-bold text-white ios-btn-primary shadow-glass-glow"
              : "w-full rounded-2xl ios-glass-input px-4 py-2.5 text-sm text-white"
          } ${
            isOpen
              ? isPill
                ? "ring-2 ring-pink-500/40 border-pink-400/40 bg-white/[0.08]"
                : "ring-2 ring-white/20 border-white/35 shadow-ios-card"
              : ""
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 text-pink-400 animate-spin shrink-0" />
            ) : (
              <CalendarIcon className="h-3.5 w-3.5 text-pink-400 shrink-0" />
            )}

            {label && !isPill && (
              <span className="text-xs text-slate-400 shrink-0">{label}:</span>
            )}

            <span
              className={`min-w-0 truncate font-semibold ${
                displayValue
                  ? "text-white"
                  : isPill
                  ? "text-pink-300"
                  : "text-slate-400"
              }`}
            >
              {displayValue
                ? label
                  ? `${label}: ${displayValue}`
                  : displayValue
                : placeholder}
            </span>
          </div>

          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ease-out ${
              isOpen ? "rotate-180 text-white" : ""
            }`}
          />
        </button>
      )}

      {/* Dropdown Floating Liquid Glass Sheet (Portaled to body) */}
      {isOpen && mounted && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          role="dialog"
          aria-modal="true"
          className="w-[316px] ios-glass-sheet p-3.5 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-inset ring-white/10 shadow-2xl backdrop-blur-2xl select-none"
        >
          {/* Header Bar: Month & Year Selectors (No Next/Previous Buttons) */}
          <div className="pb-3 mb-2 border-b border-white/[0.08]">
            {viewMode === "days" ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("months")}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white hover:bg-white/10 border border-white/10 transition cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">{MONTH_NAMES[viewMonth - 1]}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 ml-1" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("years")}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white hover:bg-white/10 border border-white/10 transition cursor-pointer flex items-center justify-between"
                >
                  <span>{viewYear}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 ml-1" />
                </button>
              </div>
            ) : viewMode === "months" ? (
              <div className="w-full flex items-center justify-between">
                <span className="text-xs font-bold text-white px-1">Select Month</span>
                <button
                  type="button"
                  onClick={() => setViewMode("days")}
                  className="px-2.5 py-1 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  Back
                </button>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between">
                <span className="text-xs font-bold text-white px-1">Select Year</span>
                <button
                  type="button"
                  onClick={() => setViewMode("days")}
                  className="px-2.5 py-1 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  Back
                </button>
              </div>
            )}
          </div>

          {/* Body View: Days Mode */}
          {viewMode === "days" && (
            <div>
              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                {WEEKDAY_NAMES.map((day) => (
                  <span
                    key={day}
                    className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1"
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Leading blank slots */}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <div key={`blank-${idx}`} className="h-8 w-8" />
                ))}

                {/* Days of current month */}
                {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const isSelected =
                    parsedValue?.year === viewYear &&
                    parsedValue?.month === viewMonth &&
                    parsedValue?.day === dayNum;
                  const isCurrentDay =
                    today.year === viewYear &&
                    today.month === viewMonth &&
                    today.day === dayNum;
                  const isDisabled = isDateDisabled(viewYear, viewMonth, dayNum);

                  return (
                    <button
                      key={`curr-${dayNum}`}
                      type="button"
                      disabled={isDisabled || isSaving}
                      onClick={() => handleSelectDate(viewYear, viewMonth, dayNum)}
                      className={`h-8 w-8 rounded-xl text-xs font-semibold flex items-center justify-center transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-md shadow-pink-500/30 scale-105 ring-1 ring-white/30"
                          : isCurrentDay
                          ? "border border-pink-500/50 text-pink-300 font-bold bg-pink-500/10 hover:bg-pink-500/20"
                          : "text-slate-200 hover:text-white hover:bg-white/[0.08]"
                      } ${
                        isDisabled
                          ? "opacity-20 cursor-not-allowed pointer-events-none text-slate-600"
                          : ""
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Body View: Months Mode */}
          {viewMode === "months" && (
            <div className="grid grid-cols-3 gap-2 py-1 max-h-56 overflow-y-auto">
              {MONTH_SHORT.map((name, idx) => {
                const monthNum = idx + 1;
                const isSelected =
                  parsedValue?.year === viewYear && parsedValue?.month === monthNum;
                const isCurrentMonth =
                  today.year === viewYear && today.month === monthNum;

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setViewMonth(monthNum);
                      setViewMode("days");
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${
                      isSelected
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-md shadow-pink-500/30"
                        : isCurrentMonth
                        ? "border border-pink-500/40 text-pink-300 bg-pink-500/10"
                        : "text-slate-300 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Body View: Years Mode */}
          {viewMode === "years" && (
            <div className="grid grid-cols-4 gap-1.5 py-1 max-h-56 overflow-y-auto pr-1">
              {yearList.map((y) => {
                const isSelected = parsedValue?.year === y;
                const isCurrentYear = today.year === y;
                const isFocused = viewYear === y;

                return (
                  <button
                    key={y}
                    ref={isFocused ? activeYearRef : undefined}
                    type="button"
                    onClick={() => {
                      setViewYear(y);
                      setViewMode("days");
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${
                      isSelected
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-md shadow-pink-500/30"
                        : isFocused
                        ? "border border-pink-500/40 text-pink-300 bg-pink-500/10"
                        : isCurrentYear
                        ? "border border-white/20 text-white"
                        : "text-slate-300 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {/* Optional Clear Button */}
          {clearable && value && (
            <div className="mt-2.5 pt-2 border-t border-white/[0.08] flex items-center justify-end">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleClear}
                className="text-xs font-medium text-rose-400 hover:text-rose-300 transition cursor-pointer flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};
