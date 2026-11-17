"use client";

import React from "react";

export type GlassProgressColor =
  | "pink"
  | "purple"
  | "cyan"
  | "emerald"
  | "amber"
  | "rose"
  | "indigo"
  | "fire"
  | "coast";

export interface GlassProgressBarProps {
  value: number;
  max?: number;
  color?: GlassProgressColor;
  size?: "xs" | "sm" | "md" | "lg";
  glow?: boolean;
  className?: string;
  ariaLabel?: string;
}

const COLOR_CONFIGS: Record<
  GlassProgressColor,
  { fillGradient: string; glowShadow: string }
> = {
  fire: {
    fillGradient: "bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400",
    glowShadow: "shadow-[0_0_12px_rgba(244,114,182,0.5)]",
  },
  coast: {
    fillGradient: "bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400",
    glowShadow: "shadow-[0_0_12px_rgba(168,85,247,0.5)]",
  },
  pink: {
    fillGradient: "bg-gradient-to-r from-pink-500 to-rose-400",
    glowShadow: "shadow-[0_0_10px_rgba(236,72,153,0.4)]",
  },
  purple: {
    fillGradient: "bg-gradient-to-r from-purple-500 to-violet-400",
    glowShadow: "shadow-[0_0_10px_rgba(168,85,247,0.4)]",
  },
  cyan: {
    fillGradient: "bg-gradient-to-r from-cyan-400 to-blue-400",
    glowShadow: "shadow-[0_0_10px_rgba(6,182,212,0.4)]",
  },
  emerald: {
    fillGradient: "bg-gradient-to-r from-emerald-400 to-teal-400",
    glowShadow: "shadow-[0_0_10px_rgba(16,185,129,0.4)]",
  },
  amber: {
    fillGradient: "bg-gradient-to-r from-amber-400 to-orange-400",
    glowShadow: "shadow-[0_0_10px_rgba(245,158,11,0.4)]",
  },
  rose: {
    fillGradient: "bg-gradient-to-r from-rose-500 to-red-400",
    glowShadow: "shadow-[0_0_10px_rgba(244,63,94,0.4)]",
  },
  indigo: {
    fillGradient: "bg-gradient-to-r from-indigo-400 to-purple-400",
    glowShadow: "shadow-[0_0_10px_rgba(99,102,241,0.4)]",
  },
};

const SIZE_CONFIGS = {
  xs: "h-1.5",
  sm: "h-2",
  md: "h-2.5",
  lg: "h-3.5",
};

export const GlassProgressBar: React.FC<GlassProgressBarProps> = ({
  value,
  max = 100,
  color = "emerald",
  size = "md",
  glow = true,
  className = "",
  ariaLabel,
}) => {
  const safeMax = max > 0 ? max : 100;
  const rawPct = (value / safeMax) * 100;
  const clampedPct = Math.min(100, Math.max(0, rawPct));
  const effectiveWidth = value > 0 ? Math.max(2, clampedPct) : 0;

  const config = COLOR_CONFIGS[color] || COLOR_CONFIGS.emerald;
  const sizeClass = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clampedPct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={`relative w-full rounded-full bg-black/40 p-0.5 overflow-hidden border border-white/10 shadow-inner ${sizeClass} ${className}`}
    >
      <div
        className={`h-full rounded-full ${config.fillGradient} ${
          glow ? config.glowShadow : ""
        } transition-all duration-700 ease-out`}
        style={{ width: `${effectiveWidth}%` }}
      />
    </div>
  );
};
