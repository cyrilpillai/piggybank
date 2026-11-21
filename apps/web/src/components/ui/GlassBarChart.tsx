"use client";

import React, { useState, useMemo, useId, useRef } from "react";
import { COPY } from "@/constants/copy";
import { GlassTooltip } from "@/components/ui/GlassTooltip";

export interface BarChartItem {
  label: string;
  value: number;
  formattedValue?: string;
  secondaryLabel?: string;
  isOthers?: boolean;
  raw?: any;
}

export interface GlassBarChartProps {
  items: BarChartItem[];
  color?: "emerald" | "rose" | "pink" | "cyan" | "amber" | "purple" | "slate";
  height?: number;
  formatValue?: (val: number) => string;
  renderTooltip?: (item: BarChartItem, index: number) => React.ReactNode;
  emptyMessage?: string;
  glow?: boolean;
  className?: string;
}

const COLOR_CONFIG = {
  emerald: {
    barTop: "#34d399",
    barBottom: "rgba(16, 185, 129, 0.2)",
    rim: "#6ee7b7",
    glowColor: "#10b981",
    activeText: "text-emerald-400",
  },
  rose: {
    barTop: "#fb7185",
    barBottom: "rgba(244, 63, 94, 0.2)",
    rim: "#fda4af",
    glowColor: "#f43f5e",
    activeText: "text-rose-400",
  },
  pink: {
    barTop: "#f472b6",
    barBottom: "rgba(236, 72, 153, 0.2)",
    rim: "#fbcfe8",
    glowColor: "#ec4899",
    activeText: "text-pink-400",
  },
  cyan: {
    barTop: "#22d3ee",
    barBottom: "rgba(6, 182, 212, 0.2)",
    rim: "#67e8f9",
    glowColor: "#06b6d4",
    activeText: "text-cyan-400",
  },
  amber: {
    barTop: "#fbbf24",
    barBottom: "rgba(245, 158, 11, 0.2)",
    rim: "#fde68a",
    glowColor: "#f59e0b",
    activeText: "text-amber-400",
  },
  purple: {
    barTop: "#c084fc",
    barBottom: "rgba(168, 85, 247, 0.2)",
    rim: "#e9d5ff",
    glowColor: "#a855f7",
    activeText: "text-purple-400",
  },
  slate: {
    barTop: "#94a3b8",
    barBottom: "rgba(100, 116, 139, 0.2)",
    rim: "#cbd5e1",
    glowColor: "#64748b",
    activeText: "text-slate-400",
  },
};

/**
 * Splits a label into at most 2 lines for chart display.
 * If the label fits within maxChars, returns [line1, null].
 * If it requires 2 lines, wraps cleanly and truncates line 2 with '…' if still too long.
 */
function splitMultilineLabel(label: string, maxChars = 7): [string, string | null] {
  const trimmed = label.trim();
  if (!trimmed) return ["", null];

  // If fits completely on one line
  if (trimmed.length <= maxChars) {
    return [trimmed, null];
  }

  const words = trimmed.split(/\s+/);

  // Single word longer than maxChars: split across 2 lines
  if (words.length === 1) {
    const line1 = words[0].slice(0, maxChars);
    const rest = words[0].slice(maxChars);
    const line2 = rest.length > maxChars ? `${rest.slice(0, maxChars - 1)}…` : rest;
    return [line1, line2];
  }

  // Multi-word label:
  // Build line 1 by accumulating words until maxChars is reached
  const line1Words: string[] = [];
  let line1Length = 0;
  let wordIdx = 0;

  while (wordIdx < words.length) {
    const word = words[wordIdx];
    const candidateLen = line1Length === 0 ? word.length : line1Length + 1 + word.length;
    if (candidateLen <= maxChars || line1Words.length === 0) {
      if (line1Words.length === 0 && word.length > maxChars) {
        line1Words.push(`${word.slice(0, maxChars - 1)}…`);
        wordIdx++;
        break;
      }
      line1Words.push(word);
      line1Length = candidateLen;
      wordIdx++;
    } else {
      break;
    }
  }

  const line1 = line1Words.join(" ");
  const remainingWords = words.slice(wordIdx);

  if (remainingWords.length === 0) {
    return [line1, null];
  }

  // Build line 2 from remaining words, truncating if longer than maxChars
  const line2Raw = remainingWords.join(" ");
  const line2 = line2Raw.length > maxChars ? `${line2Raw.slice(0, maxChars - 1)}…` : line2Raw;

  return [line1, line2];
}

export const GlassBarChart: React.FC<GlassBarChartProps> = ({
  items,
  color = "emerald",
  height = 190,
  formatValue = (v) => v.toLocaleString(),
  renderTooltip,
  emptyMessage = COPY.HOLDINGS_CHART.EMPTY_ASSETS,
  glow = true,
  className = "",
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const chartId = useId();
  const gradId = `glass-bar-grad-${chartId.replace(/:/g, "")}`;
  const othersGradId = `glass-bar-others-grad-${chartId.replace(/:/g, "")}`;
  const glowId = `glass-bar-glow-${chartId.replace(/:/g, "")}`;

  const config = COLOR_CONFIG[color] || COLOR_CONFIG.emerald;
  const width = 480;
  const padding = { top: 12, right: 0, bottom: 24, left: 0 };

  const { bars, maxVal } = useMemo(() => {
    if (!items || items.length === 0) {
      return { bars: [], maxVal: 1 };
    }

    const max = Math.max(...items.map((i) => Number(i.value) || 0), 1);
    const availableWidth = width - padding.left - padding.right;
    const availableHeight = height - padding.top - padding.bottom;
    const count = items.length;
    const slotWidth = availableWidth / count;
    const barWidth = Math.min(36, Math.max(16, slotWidth * 0.72));

    const calculatedBars = items.map((item, idx) => {
      const val = Math.max(0, Number(item.value) || 0);
      const ratio = val / max;
      const barH = Math.max(val > 0 ? 5 : 0, ratio * availableHeight);
      const x = padding.left + idx * slotWidth + (slotWidth - barWidth) / 2;
      const y = height - padding.bottom - barH;
      const centerX = x + barWidth / 2;

      return {
        item,
        idx,
        val,
        x,
        y,
        barW: barWidth,
        barH,
        centerX,
        slotWidth,
        slotX: padding.left + idx * slotWidth,
      };
    });

    return { bars: calculatedBars, maxVal: max };
  }, [items, height]);

  if (!items || items.length === 0) {
    return (
      <div className={`flex items-center justify-center text-xs text-slate-500 py-12 ${className}`}>
        <span>{emptyMessage}</span>
      </div>
    );
  }

  const activeBar = hoverIndex !== null && bars[hoverIndex] ? bars[hoverIndex] : null;

  return (
    <div className={`relative w-full min-w-0 select-none ${className}`}>
      {/* SVG Container */}
      <div className="relative w-full overflow-visible">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* Primary Accent Gradient */}
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.barTop} stopOpacity="0.95" />
              <stop offset="100%" stopColor={config.barBottom} stopOpacity="0.25" />
            </linearGradient>

            {/* Others Neutral Gradient */}
            <linearGradient id={othersGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="rgba(100, 116, 139, 0.2)" stopOpacity="0.2" />
            </linearGradient>

            {/* Subtle Liquid Glow Filter */}
            {glow && (
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="2.5"
                  floodColor={config.glowColor}
                  floodOpacity="0.5"
                />
              </filter>
            )}
          </defs>

          {/* Baseline Subtle Reference Line */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />

          {/* Render Bars */}
          {bars.map((bar) => {
            const isHovered = hoverIndex === bar.idx;
            const isOthers = Boolean(bar.item.isOthers);
            const fillUrl = isOthers ? `url(#${othersGradId})` : `url(#${gradId})`;
            const isDimmed = hoverIndex !== null && !isHovered;

            return (
              <g key={bar.idx} className="transition-opacity duration-150">
                {/* Bar Body */}
                <rect
                  x={bar.x}
                  y={bar.y}
                  width={bar.barW}
                  height={bar.barH}
                  rx="6"
                  ry="6"
                  fill={fillUrl}
                  opacity={isDimmed ? 0.45 : 1}
                  filter={glow && isHovered ? `url(#${glowId})` : undefined}
                  className="transition-all duration-200"
                />

                {/* Value on top of bar */}
                <text
                  x={bar.centerX}
                  y={bar.y - 5}
                  textAnchor="middle"
                  className={`text-[10px] font-mono font-bold select-none transition-opacity duration-150 ${
                    isHovered
                      ? "fill-white"
                      : isDimmed
                      ? "fill-slate-500"
                      : "fill-slate-400"
                  }`}
                >
                  {bar.item.formattedValue || formatValue(bar.val)}
                </text>

                {/* X-axis Label below bar (Multiline, max 2 lines) */}
                {(() => {
                  const [line1, line2] = splitMultilineLabel(bar.item.label, 7);
                  const textClass = `text-[9.5px] font-mono select-none transition-colors duration-150 ${
                    isHovered
                      ? "fill-white font-bold"
                      : isOthers
                      ? "fill-slate-400 italic"
                      : "fill-slate-400 font-medium"
                  }`;

                  if (line2) {
                    return (
                      <text
                        x={bar.centerX}
                        textAnchor="middle"
                        className={textClass}
                      >
                        <tspan x={bar.centerX} y={height - padding.bottom + 12}>
                          {line1}
                        </tspan>
                        <tspan x={bar.centerX} y={height - padding.bottom + 22}>
                          {line2}
                        </tspan>
                      </text>
                    );
                  }

                  return (
                    <text
                      x={bar.centerX}
                      y={height - padding.bottom + 15}
                      textAnchor="middle"
                      className={textClass}
                    >
                      {line1}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {/* Invisible Hover Trigger Columns */}
          {bars.map((bar) => (
            <rect
              key={`trigger-${bar.idx}`}
              x={bar.slotX}
              y={padding.top}
              width={bar.slotWidth}
              height={height - padding.top}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(bar.idx)}
            />
          ))}
        </svg>

        {/* Top-layer Portal Tooltip: rendered into document.body to prevent clipping by card overflow-hidden */}
        {(() => {
          let anchorX = 0;
          let anchorY = 0;
          if (activeBar && svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            anchorX = rect.left + (activeBar.centerX / width) * rect.width;
            anchorY =
              rect.top +
              (Math.max(20, Math.min(height - 20, activeBar.y)) / height) * rect.height;
          }

          return (
            <GlassTooltip
              isOpen={Boolean(activeBar)}
              anchorX={anchorX}
              anchorY={anchorY}
              offset={14}
            >
              {activeBar &&
                (renderTooltip ? (
                  renderTooltip(activeBar.item, activeBar.idx)
                ) : (
                  <div className="relative overflow-hidden rounded-2xl ios-glass p-3 border border-white/15 border-t-white/35 shadow-glass-glow backdrop-blur-2xl text-xs space-y-1 min-w-[150px]">
                    <div className="font-bold text-white truncate">{activeBar.item.label}</div>
                    <div className="text-slate-300 font-mono font-bold">
                      {activeBar.item.formattedValue || formatValue(activeBar.val)}
                    </div>
                  </div>
                ))}
            </GlassTooltip>
          );
        })()}
      </div>
    </div>
  );
};
