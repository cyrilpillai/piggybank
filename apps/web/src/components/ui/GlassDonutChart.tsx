"use client";

import React, { useState, useMemo } from "react";
import { clampToTopSplits } from "@/lib/format";

export interface GlassDonutSegment {
  label: string;
  value: number;
  color: string;
  percentage?: number;
  sublabel?: string;
  [key: string]: any;
}

export interface GlassDonutChartProps {
  segments: GlassDonutSegment[];
  selectedLabel?: string | null;
  onSelect?: (segment: GlassDonutSegment | null) => void;
  onHover?: (segment: GlassDonutSegment | null) => void;
  size?: number;
  thickness?: number;
  padAngle?: number;
  renderCenter?: (
    activeSegment: GlassDonutSegment | null,
    totalValue: number,
    isHovered: boolean
  ) => React.ReactNode;
  glow?: boolean;
  className?: string;
  ariaLabel?: string;
  maxSegments?: number;
}

function createArcPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number,
  padAngle = 0.035
): string {
  const angleSpan = endAngle - startAngle;
  if (angleSpan <= 0.001) return "";

  // Cap padding so it never consumes more than 25% of the slice arc, preventing small slices from vanishing
  const effectivePad =
    angleSpan > Math.PI * 1.95 ? 0 : Math.min(padAngle, angleSpan * 0.25);
  const a0 = startAngle + effectivePad / 2;
  const a1 = endAngle - effectivePad / 2;
  if (a1 <= a0) return "";

  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  const x1 = cx + rOuter * Math.cos(a0);
  const y1 = cy + rOuter * Math.sin(a0);
  const x2 = cx + rOuter * Math.cos(a1);
  const y2 = cy + rOuter * Math.sin(a1);
  const x3 = cx + rInner * Math.cos(a1);
  const y3 = cy + rInner * Math.sin(a1);
  const x4 = cx + rInner * Math.cos(a0);
  const y4 = cy + rInner * Math.sin(a0);

  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
}

export const GlassDonutChart: React.FC<GlassDonutChartProps> = ({
  segments,
  selectedLabel,
  onSelect,
  onHover,
  size = 320,
  thickness = 46,
  padAngle = 0.035,
  renderCenter,
  glow = true,
  className = "",
  ariaLabel,
  maxSegments = 10,
}) => {
  const [internalHoveredLabel, setInternalHoveredLabel] = useState<string | null>(null);

  // Clamp segments to maxSegments (default 10: top 9 + Others)
  const clampedSegments = useMemo(() => {
    return clampToTopSplits(segments, maxSegments);
  }, [segments, maxSegments]);

  const cx = size / 2;
  const cy = size / 2;
  const rOuterBase = (size / 2) - 16;
  const rInnerBase = rOuterBase - thickness;
  const rMid = (rOuterBase + rInnerBase) / 2;

  const totalValue = useMemo(() => {
    return clampedSegments.reduce((sum, s) => sum + Math.max(0, Number(s.value) || 0), 0);
  }, [clampedSegments]);

  // Slices calculation with guaranteed minimum visible angle for small slices
  const computedSlices = useMemo(() => {
    if (!clampedSegments || clampedSegments.length === 0) return [];

    const nonZeroSegments = clampedSegments.filter((s) => (Number(s.value) || 0) > 0);
    if (nonZeroSegments.length === 0) return [];

    const totalVal = totalValue > 0 ? totalValue : 1;
    const fullCircle = 2 * Math.PI;

    // Minimum visible angle in radians for any non-zero slice
    // ~0.06 rad is approx 3.44 degrees (~9px arc length), ensuring even a tiny debt (e.g. 5k vs 20L) is visible & clickable
    const MIN_ANGLE = nonZeroSegments.length > 1 ? 0.06 : fullCircle;

    const segmentData = clampedSegments.map((seg, idx) => {
      const segVal = Math.max(0, Number(seg.value) || 0);
      const computedPct =
        seg.percentage !== undefined
          ? Number(seg.percentage)
          : totalVal > 0
          ? (segVal / totalVal) * 100
          : 0;

      const naturalSpan = (computedPct / 100) * fullCircle;
      return {
        seg,
        idx,
        val: segVal,
        percentage: computedPct,
        naturalSpan,
      };
    });

    const activeSegments = segmentData.filter((s) => s.val > 0);
    let finalSpans: number[] = [];

    if (activeSegments.length === 1) {
      finalSpans = segmentData.map((s) => (s.val > 0 ? fullCircle : 0));
    } else {
      const smallSlices = activeSegments.filter((s) => s.naturalSpan < MIN_ANGLE);
      const largeSlices = activeSegments.filter((s) => s.naturalSpan >= MIN_ANGLE);

      if (smallSlices.length > 0 && largeSlices.length > 0) {
        const totalSmallAllocated = smallSlices.length * MIN_ANGLE;
        const remainingAngleForLarge = fullCircle - totalSmallAllocated;
        const totalLargeNatural = largeSlices.reduce((sum, s) => sum + s.naturalSpan, 0);

        finalSpans = segmentData.map((s) => {
          if (s.val <= 0) return 0;
          if (s.naturalSpan < MIN_ANGLE) return MIN_ANGLE;
          return totalLargeNatural > 0
            ? (s.naturalSpan / totalLargeNatural) * remainingAngleForLarge
            : s.naturalSpan;
        });
      } else {
        finalSpans = segmentData.map((s) => s.naturalSpan);
      }
    }

    let currentAngle = -Math.PI / 2;
    return segmentData.map((data, idx) => {
      const angleSpan = finalSpans[idx];
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      currentAngle = endAngle;

      return {
        segment: data.seg,
        startAngle,
        endAngle,
        percentage: data.percentage,
        index: idx,
      };
    });
  }, [clampedSegments, totalValue]);

  // Determine active segment (hover takes priority over selected)
  const activeSegment = useMemo(() => {
    const activeLabel = internalHoveredLabel || selectedLabel;
    if (!activeLabel) return null;
    return clampedSegments.find((s) => s.label === activeLabel) || null;
  }, [internalHoveredLabel, selectedLabel, clampedSegments]);

  const handleMouseEnter = (seg: GlassDonutSegment) => {
    setInternalHoveredLabel(seg.label);
    onHover?.(seg);
  };

  const handleMouseLeave = () => {
    setInternalHoveredLabel(null);
    onHover?.(null);
  };

  const handleClick = (seg: GlassDonutSegment) => {
    if (selectedLabel === seg.label) {
      onSelect?.(null);
    } else {
      onSelect?.(seg);
    }
  };

  const filterId = useMemo(
    () => `glass-donut-glow-${Math.random().toString(36).substring(2, 9)}`,
    []
  );

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      aria-label={ariaLabel}
    >
      <div
        className="relative"
        style={{ width: size, height: size, maxWidth: "100%", maxHeight: "100%" }}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full transform transition-transform duration-300"
        >
          {glow && (
            <defs>
              <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ffffff" floodOpacity="0.35" />
              </filter>
            </defs>
          )}

          {/* Background Track Ring */}
          <circle
            cx={cx}
            cy={cy}
            r={rMid}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={thickness}
          />

          {/* Slices */}
          {computedSlices.length === 1 ? (
            /* Single slice = 100% full circle */
            <circle
              cx={cx}
              cy={cy}
              r={rMid}
              fill="none"
              stroke={computedSlices[0].segment.color}
              strokeWidth={thickness}
              className="cursor-pointer transition-all duration-300 hover:opacity-90"
              onClick={() => handleClick(computedSlices[0].segment)}
            />
          ) : (
            computedSlices.map((slice) => {
              const isSelected = selectedLabel === slice.segment.label;
              const isHovered = internalHoveredLabel === slice.segment.label;
              const isHighlighted = isSelected || isHovered;

              const rInner = isHighlighted ? rInnerBase - 4 : rInnerBase;
              const rOuter = isHighlighted ? rOuterBase + 6 : rOuterBase;
              const d = createArcPath(
                cx,
                cy,
                rInner,
                rOuter,
                slice.startAngle,
                slice.endAngle,
                padAngle
              );

              return (
                <path
                  key={`${slice.segment.label}-${slice.index}`}
                  d={d}
                  fill={slice.segment.color}
                  className="cursor-pointer transition-all duration-200 select-none"
                  style={{
                    opacity: selectedLabel && !isSelected && !isHovered ? 0.3 : 0.96,
                    filter: isHighlighted && glow ? `url(#${filterId})` : undefined,
                  }}
                  onMouseEnter={() => handleMouseEnter(slice.segment)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleClick(slice.segment)}
                />
              );
            })
          )}
        </svg>

        {/* Dynamic Center Metric Readout Container */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none select-none"
          style={{ width: size, height: size }}
        >
          {renderCenter ? (
            renderCenter(activeSegment, totalValue, Boolean(internalHoveredLabel))
          ) : activeSegment ? (
            <div className="space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block max-w-[140px] truncate mx-auto">
                {activeSegment.label}
              </span>
              <span className="text-2xl font-black text-white tracking-tight block">
                {activeSegment.value.toLocaleString()}
              </span>
              {activeSegment.percentage !== undefined && (
                <span className="ios-badge ios-badge-neutral text-xs font-bold text-white">
                  {activeSegment.percentage.toFixed(1)}%
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total
              </span>
              <span className="text-2xl font-black text-white tracking-tight block">
                {totalValue.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-medium block">
                {segments.length} {segments.length === 1 ? "item" : "items"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
