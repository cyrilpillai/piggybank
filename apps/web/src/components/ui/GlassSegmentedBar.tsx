"use client";

import React, { useMemo } from "react";
import { clampToTopSplits } from "@/lib/format";

export interface GlassSegmentItem {
  label: string;
  value: number | string;
  percentage?: number;
  color: string;
  dotColor?: string;
  textColor?: string;
  count?: number;
  formattedValue?: string;
  sublabel?: string;
  institution?: string;
  [key: string]: any;
}

export interface GlassSegmentedBarProps {
  segments: GlassSegmentItem[];
  totalValue?: number;
  height?: "sm" | "md" | "lg";
  showLegend?: boolean;
  legendVariant?: "list" | "grid";
  className?: string;
  onSegmentClick?: (segment: GlassSegmentItem) => void;
  ariaLabel?: string;
  maxSegments?: number;
  formatValue?: (val: number) => string;
}

const HEIGHT_CONFIGS = {
  sm: "h-2",
  md: "h-2.5",
  lg: "h-3",
};

export const GlassSegmentedBar: React.FC<GlassSegmentedBarProps> = ({
  segments,
  totalValue,
  height = "md",
  showLegend = true,
  legendVariant = "list",
  className = "",
  onSegmentClick,
  ariaLabel,
  maxSegments = 10,
  formatValue,
}) => {
  // Clamp segments to maxSegments (default 10: top 9 + Others)
  const clampedSegments = useMemo(() => {
    return clampToTopSplits(segments, maxSegments, { formatValue });
  }, [segments, maxSegments, formatValue]);

  const computedTotal = useMemo(() => {
    if (totalValue !== undefined && totalValue > 0) return totalValue;
    return clampedSegments.reduce((sum, s) => sum + Math.max(0, Number(s.value) || 0), 0);
  }, [clampedSegments, totalValue]);

  const computedSegments = useMemo(() => {
    return clampedSegments.map((seg) => {
      const segVal = Math.max(0, Number(seg.value) || 0);
      const pct =
        seg.percentage !== undefined
          ? Number(seg.percentage)
          : computedTotal > 0
          ? (segVal / computedTotal) * 100
          : 0;
      return {
        ...seg,
        pct,
      };
    });
  }, [clampedSegments, computedTotal]);

  const heightClass = HEIGHT_CONFIGS[height] || HEIGHT_CONFIGS.md;

  if (!segments || segments.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`} aria-label={ariaLabel}>
      {/* Single Multi-Colored Segmented Progress Bar */}
      <div
        className={`relative w-full rounded-full bg-black/40 p-0.5 overflow-hidden border border-white/10 shadow-inner flex gap-[2px] ${heightClass}`}
      >
        {computedSegments.map((seg, idx) => {
          const isHex = seg.color.startsWith("#") || seg.color.startsWith("rgb");
          return (
            <div
              key={`${seg.label}-${idx}`}
              className={`h-full ${!isHex ? seg.color : ""} ${
                idx === 0 ? "rounded-l-full" : ""
              } ${idx === computedSegments.length - 1 ? "rounded-r-full" : ""} transition-all duration-500 shadow-sm ${
                onSegmentClick ? "cursor-pointer hover:opacity-90" : ""
              }`}
              style={{
                width: `${Math.max(1.5, seg.pct)}%`,
                backgroundColor: isHex ? seg.color : undefined,
              }}
              title={`${seg.label}: ${seg.pct.toFixed(2)}%`}
              onClick={onSegmentClick ? () => onSegmentClick(seg) : undefined}
            />
          );
        })}
      </div>

      {/* Legend with Details */}
      {showLegend && (
        <div
          className={
            legendVariant === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1"
              : "space-y-2 pt-1"
          }
        >
          {computedSegments.map((seg, idx) => {
            const isHex = seg.color.startsWith("#") || seg.color.startsWith("rgb");
            const dotClass =
              seg.dotColor || (!isHex ? seg.color : "");

            return (
              <div
                key={`${seg.label}-${idx}`}
                className="flex items-center justify-between text-xs py-1 px-1 rounded-lg hover:bg-white/[0.03] transition-colors"
                onClick={onSegmentClick ? () => onSegmentClick(seg) : undefined}
              >
                {/* Left: Indicator Dot, Full Sub-type Label, and Item Count / Institution */}
                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 shadow-sm ${dotClass}`}
                    style={{
                      backgroundColor: isHex && !seg.dotColor ? seg.color : undefined,
                    }}
                  />
                  <div className="flex items-baseline gap-2 min-w-0 truncate">
                    <span className="font-semibold text-white text-xs sm:text-[13px] truncate">
                      {seg.label}
                    </span>
                    {seg.sublabel ? (
                      <span className="text-[11px] text-slate-400 font-normal shrink-0">
                        ({seg.sublabel})
                      </span>
                    ) : seg.institution ? (
                      <span className="text-[11px] text-slate-400 font-normal shrink-0">
                        ({seg.institution})
                      </span>
                    ) : seg.count !== undefined && (seg.count > 1 || seg.label === "Others") ? (
                      <span className="text-[11px] text-slate-400 font-normal shrink-0">
                        ({seg.count} {seg.count === 1 ? "item" : "items"})
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Right: Formatted Balance and Exact Percentage */}
                <div className="flex items-center gap-1.5 shrink-0 text-right">
                  {seg.formattedValue && (
                    <span className="font-bold text-white text-xs sm:text-[13px]">
                      {seg.formattedValue}
                    </span>
                  )}
                  <span
                    className={`font-mono text-xs font-semibold ${
                      seg.textColor || "text-slate-300"
                    }`}
                  >
                    ({seg.pct.toFixed(2)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
