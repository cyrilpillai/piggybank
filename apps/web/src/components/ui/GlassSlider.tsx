"use client";

import React, { useState, useEffect } from "react";

export interface GlassSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  color?: "pink" | "cyan" | "emerald" | "amber" | "purple" | "slate";
  unit?: string;
  showInput?: boolean;
  showBounds?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

const COLOR_CONFIG = {
  pink: {
    fillStart: "rgba(236, 72, 153, 0.7)",
    fillEnd: "rgba(244, 114, 182, 0.95)",
    rangeClass: "ios-glass-range-pink",
    textClass: "text-pink-400",
  },
  cyan: {
    fillStart: "rgba(6, 182, 212, 0.7)",
    fillEnd: "rgba(34, 211, 238, 0.95)",
    rangeClass: "ios-glass-range-cyan",
    textClass: "text-cyan-400",
  },
  amber: {
    fillStart: "rgba(245, 158, 11, 0.7)",
    fillEnd: "rgba(251, 191, 36, 0.95)",
    rangeClass: "ios-glass-range-amber",
    textClass: "text-amber-300",
  },
  emerald: {
    fillStart: "rgba(16, 185, 129, 0.7)",
    fillEnd: "rgba(52, 211, 153, 0.95)",
    rangeClass: "ios-glass-range-emerald",
    textClass: "text-emerald-300",
  },
  purple: {
    fillStart: "rgba(168, 85, 247, 0.7)",
    fillEnd: "rgba(192, 132, 252, 0.95)",
    rangeClass: "ios-glass-range-purple",
    textClass: "text-purple-300",
  },
  slate: {
    fillStart: "rgba(148, 163, 184, 0.6)",
    fillEnd: "rgba(203, 213, 225, 0.9)",
    rangeClass: "ios-glass-range-slate",
    textClass: "text-slate-300",
  },
};

export const GlassSlider: React.FC<GlassSliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  color = "pink",
  unit,
  showInput = true,
  showBounds = true,
  disabled = false,
  className = "",
  id,
  ariaLabel,
}) => {
  const [inputValue, setInputValue] = useState<string>(value.toString());

  // Keep local input field in sync with external value changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const config = COLOR_CONFIG[color] || COLOR_CONFIG.pink;
  const safeMin = Number(min);
  const safeMax = Number(max);
  const range = safeMax - safeMin || 1;
  const percentage = Math.min(100, Math.max(0, ((value - safeMin) / range) * 100));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setInputValue(val.toString());
    onChange(val);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleInputBlur = () => {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed) || parsed < safeMin) {
      setInputValue(safeMin.toString());
      onChange(safeMin);
    } else if (parsed > safeMax) {
      setInputValue(safeMax.toString());
      onChange(safeMax);
    } else {
      setInputValue(parsed.toString());
      onChange(parsed);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-3.5">
        {/* Liquid Glass Track & Thumb */}
        <div className="relative flex-1 flex items-center py-1">
          <input
            id={id}
            type="range"
            min={safeMin}
            max={safeMax}
            step={step}
            value={value}
            disabled={disabled}
            onChange={handleSliderChange}
            aria-label={ariaLabel}
            className={`ios-glass-range ${config.rangeClass} ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            style={{
              background: `linear-gradient(to right, ${config.fillStart} 0%, ${config.fillEnd} ${percentage}%, rgba(255, 255, 255, 0.07) ${percentage}%, rgba(255, 255, 255, 0.07) 100%)`,
            }}
          />
        </div>

        {/* Synchronized Glass Input Box */}
        {showInput && (
          <div className="relative flex items-center shrink-0">
            <input
              type="number"
              min={safeMin}
              max={safeMax}
              step="any"
              value={inputValue}
              disabled={disabled}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className={`w-20 ${
                unit ? "pr-6 pl-2" : "px-2"
              } py-1.5 rounded-xl ios-glass-input text-white text-center font-mono text-xs focus:outline-none transition-all ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
            {unit && (
              <span className="absolute right-2 text-[11px] font-mono text-slate-400 pointer-events-none select-none">
                {unit}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Subtle Min/Max Range Boundaries */}
      {showBounds && (
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 px-0.5 select-none">
          <span>
            {safeMin}
            {unit}
          </span>
          <span>
            {safeMax}
            {unit}
          </span>
        </div>
      )}
    </div>
  );
};
