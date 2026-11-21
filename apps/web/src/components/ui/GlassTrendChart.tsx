"use client";

import React, { useState, useMemo, useId, useRef } from "react";
import { COPY } from "@/constants/copy";
import { GlassTooltip } from "@/components/ui/GlassTooltip";

export interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

export interface GlassTrendChartProps {
  data: ChartDataPoint[];
  color?: "emerald" | "pink" | "cyan" | "amber" | "purple" | "slate";
  height?: number;
  strokeWidth?: number;
  showArea?: boolean;
  showGrid?: boolean;
  showPoints?: boolean;
  formatValue?: (val: number) => string;
  formatDate?: (dateStr: string) => string;
  renderTooltip?: (point: ChartDataPoint, index: number) => React.ReactNode;
  tooltipMode?: "floating" | "bottom" | "none";
  emptyMessage?: string;
  glow?: boolean;
  className?: string;
  ariaLabel?: string;
}

const COLOR_CONFIG = {
  emerald: {
    stroke: "#10b981",
    fillStart: "rgba(16, 185, 129, 0.35)",
    fillEnd: "rgba(16, 185, 129, 0.0)",
    glowColor: "#10b981",
    dotClass: "bg-emerald-400",
    textClass: "text-emerald-400",
  },
  pink: {
    stroke: "#f472b6",
    fillStart: "rgba(244, 114, 182, 0.35)",
    fillEnd: "rgba(244, 114, 182, 0.0)",
    glowColor: "#f472b6",
    dotClass: "bg-pink-400",
    textClass: "text-pink-400",
  },
  cyan: {
    stroke: "#22d3ee",
    fillStart: "rgba(34, 211, 238, 0.35)",
    fillEnd: "rgba(34, 211, 238, 0.0)",
    glowColor: "#22d3ee",
    dotClass: "bg-cyan-400",
    textClass: "text-cyan-400",
  },
  amber: {
    stroke: "#fbbf24",
    fillStart: "rgba(251, 191, 36, 0.35)",
    fillEnd: "rgba(251, 191, 36, 0.0)",
    glowColor: "#fbbf24",
    dotClass: "bg-amber-400",
    textClass: "text-amber-400",
  },
  purple: {
    stroke: "#c084fc",
    fillStart: "rgba(192, 132, 252, 0.35)",
    fillEnd: "rgba(192, 132, 252, 0.0)",
    glowColor: "#c084fc",
    dotClass: "bg-purple-400",
    textClass: "text-purple-400",
  },
  slate: {
    stroke: "#94a3b8",
    fillStart: "rgba(148, 163, 184, 0.25)",
    fillEnd: "rgba(148, 163, 184, 0.0)",
    glowColor: "#94a3b8",
    dotClass: "bg-slate-400",
    textClass: "text-slate-400",
  },
};

/**
 * Creates smooth bezier curve path points
 */
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export const GlassTrendChart: React.FC<GlassTrendChartProps> = ({
  data,
  color = "emerald",
  height = 240,
  strokeWidth = 2.5,
  showArea = true,
  showGrid = true,
  showPoints = false,
  formatValue = (v) => v.toLocaleString(),
  formatDate = (d) => d,
  renderTooltip,
  tooltipMode = "floating",
  emptyMessage = COPY.NET_WORTH_TREND.EMPTY_TITLE,
  glow = true,
  className = "",
  ariaLabel,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const chartId = useId();
  const gradId = `glass-trend-grad-${chartId.replace(/:/g, "")}`;
  const glowId = `glass-trend-glow-${chartId.replace(/:/g, "")}`;

  const config = COLOR_CONFIG[color] || COLOR_CONFIG.emerald;
  const width = 480;
  const padding = { top: 4, right: 0, bottom: 18, left: 34 };

  // Calculate layout coordinates
  const { points, minVal, maxVal, singlePoint } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], minVal: 0, maxVal: 1, singlePoint: false };
    }

    if (data.length === 1) {
      const val = Number(data[0].value) || 0;
      const x = width / 2;
      const y = height / 2;
      return {
        points: [{ x, y, raw: data[0], idx: 0 }],
        minVal: val,
        maxVal: val,
        singlePoint: true,
      };
    }

    let min = Infinity;
    let max = -Infinity;

    data.forEach((d) => {
      const val = Number(d.value) || 0;
      if (val < min) min = val;
      if (val > max) max = val;
    });

    if (min === max) {
      min = min * 0.9;
      max = max > 0 ? max * 1.1 : 100;
    } else {
      // Add 4% vertical headroom
      const delta = max - min;
      max = max + delta * 0.04;
      min = Math.max(0, min - delta * 0.04);
    }

    const scaleX = (index: number) => {
      const denom = data.length - 1 || 1;
      return padding.left + (index / denom) * (width - padding.left - padding.right);
    };

    const scaleY = (val: number) => {
      const range = max - min || 1;
      const clamped = Math.max(min, Math.min(max, val));
      return (
        height -
        padding.bottom -
        ((clamped - min) / range) * (height - padding.top - padding.bottom)
      );
    };

    const pts = data.map((d, idx) => ({
      x: scaleX(idx),
      y: scaleY(Number(d.value) || 0),
      raw: d,
      idx,
    }));

    return { points: pts, minVal: min, maxVal: max, singlePoint: false };
  }, [data, height]);

  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-xs text-slate-500 py-12 ${className}`}
        aria-label={ariaLabel}
      >
        <span>{emptyMessage}</span>
      </div>
    );
  }

  const linePath = createSmoothPath(points);
  const baselineY = height - padding.bottom;
  const areaPath =
    points.length >= 2
      ? `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
      : "";

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  // Select evenly spaced indices for X-axis labels (up to 4 labels)
  const xLabelIndices = useMemo(() => {
    if (points.length <= 4) return points.map((_, i) => i);
    const step = (points.length - 1) / 3;
    return [0, Math.round(step), Math.round(step * 2), points.length - 1];
  }, [points]);

  return (
    <div className={`relative w-full min-w-0 ${className}`} aria-label={ariaLabel}>
      {/* Responsive SVG Chart & Floating Tooltip Container */}
      <div className="relative w-full overflow-visible select-none min-w-0">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.stroke} stopOpacity="0.32" />
              <stop offset="100%" stopColor={config.stroke} stopOpacity="0.0" />
            </linearGradient>

            {glow && (
              <filter id={glowId} x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="3"
                  floodColor={config.glowColor}
                  floodOpacity="0.4"
                />
              </filter>
            )}
          </defs>

          {/* Grid lines and Y-axis scale */}
          {showGrid &&
            [0, 0.25, 0.5, 0.75, 1.0].map((pct) => {
              const y =
                height - padding.bottom - pct * (height - padding.top - padding.bottom);
              const val = minVal + pct * (maxVal - minVal);
              return (
                <g key={pct}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 6}
                    y={y + 3.5}
                    textAnchor="end"
                    className="fill-slate-400 text-xs font-semibold font-mono select-none"
                  >
                    {formatValue(val)}
                  </text>
                </g>
              );
            })}

          {/* Area Fill */}
          {showArea && areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}

          {/* Single point fallback horizontal dashed reference line */}
          {singlePoint && (
            <line
              x1={padding.left}
              y1={points[0].y}
              x2={width - padding.right}
              y2={points[0].y}
              stroke={config.stroke}
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.4"
            />
          )}

          {/* Line Curve */}
          {linePath && !singlePoint && (
            <path
              d={linePath}
              fill="none"
              stroke={config.stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter={glow ? `url(#${glowId})` : undefined}
            />
          )}

          {/* Optional persistent data points */}
          {showPoints &&
            points.map((pt) => (
              <circle
                key={pt.idx}
                cx={pt.x}
                cy={pt.y}
                r="3"
                fill={config.stroke}
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            ))}

          {/* Single point prominent circle */}
          {singlePoint && (
            <g>
              <circle
                cx={points[0].x}
                cy={points[0].y}
                r="8"
                fill={config.stroke}
                fillOpacity="0.3"
                className="animate-ping"
              />
              <circle
                cx={points[0].x}
                cy={points[0].y}
                r="6"
                fill={config.stroke}
                stroke="#fff"
                strokeWidth="2"
              />
            </g>
          )}

          {/* X-axis date labels */}
          {xLabelIndices.map((idx) => {
            const pt = points[idx];
            if (!pt) return null;
            return (
              <text
                key={idx}
                x={pt.x}
                y={height - padding.bottom + 15}
                textAnchor="middle"
                className="fill-slate-400 text-xs font-semibold font-mono select-none"
              >
                {formatDate(pt.raw.date)}
              </text>
            );
          })}

          {/* Invisible hover trigger columns */}
          {points.map((pt, i) => {
            const colWidth =
              points.length > 1
                ? (width - padding.left - padding.right) / (points.length - 1)
                : width - padding.left - padding.right;
            return (
              <rect
                key={pt.idx}
                x={pt.x - colWidth / 2}
                y={padding.top}
                width={colWidth}
                height={height - padding.top - padding.bottom}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
              />
            );
          })}

          {/* Active Hover Crosshair Line & Dot */}
          {activePoint && !singlePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={height - padding.bottom}
                stroke="rgba(255,255,255,0.25)"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="7"
                fill={config.stroke}
                fillOpacity="0.3"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="4.5"
                fill={config.stroke}
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Top-layer Portal Tooltip: rendered into document.body to prevent clipping by card overflow-hidden */}
        {(() => {
          let anchorX = 0;
          let anchorY = 0;
          if (activePoint && svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            anchorX = rect.left + (activePoint.x / width) * rect.width;
            anchorY =
              rect.top +
              (Math.max(16, Math.min(height - 16, activePoint.y)) / height) * rect.height;
          }

          return (
            <GlassTooltip
              isOpen={Boolean(activePoint && tooltipMode === "floating")}
              anchorX={anchorX}
              anchorY={anchorY}
              offset={14}
            >
              {activePoint &&
                (renderTooltip ? (
                  renderTooltip(activePoint.raw, activePoint.idx)
                ) : (
                  <div className="ios-glass-card px-3 py-1.5 rounded-2xl text-xs backdrop-blur-2xl border border-white/20 border-t-white/35 shadow-glass-glow flex items-center gap-2.5">
                    <span className="text-slate-400 font-mono">
                      {formatDate(activePoint.raw.date)}
                    </span>
                    <span className="text-white font-bold font-mono">
                      {formatValue(activePoint.raw.value)}
                    </span>
                  </div>
                ))}
            </GlassTooltip>
          );
        })()}
      </div>

    {/* Hover Info Tooltip Bar (Bottom Mode only) */}
    {activePoint && tooltipMode === "bottom" ? (
      <div className="mt-2">
        {renderTooltip ? (
          renderTooltip(activePoint.raw, activePoint.idx)
        ) : (
          <div className="ios-glass-pill inline-flex items-center gap-3 px-4 py-1.5 rounded-full text-xs">
            <span className="text-slate-400 font-mono">
              {formatDate(activePoint.raw.date)}
            </span>
            <span className="text-white font-bold font-mono">
              {formatValue(activePoint.raw.value)}
            </span>
          </div>
        )}
      </div>
    ) : singlePoint ? (
      <div className="mt-2 text-center text-xs text-slate-400">
        {COPY.NET_WORTH_TREND.SINGLE_POINT_NOTE}
      </div>
    ) : null}
    </div>
  );
};
