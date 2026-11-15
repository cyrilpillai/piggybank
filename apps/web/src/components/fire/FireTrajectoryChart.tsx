"use client";

import React, { useState, useMemo } from "react";
import { TrajectoryPoint } from "@/types";
import { formatCurrencyAmount } from "@/lib/format";

interface FireTrajectoryChartProps {
  trajectory: TrajectoryPoint[];
  currencySymbol: string;
  baseCurrency?: string;
  currentAge: number;
  goalAge: number;
  fullFiAge?: number | null;
}

export const FireTrajectoryChart: React.FC<FireTrajectoryChartProps> = ({
  trajectory,
  currencySymbol,
  baseCurrency = "INR",
  currentAge: _currentAge,
  goalAge,
  fullFiAge,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

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

  const { points, maxVal, minAge, maxAge, width, height, padding } = useMemo(() => {
    const w = 800;
    const h = 340;
    const pad = { top: 25, right: 30, bottom: 40, left: 60 };

    if (!trajectory || trajectory.length === 0) {
      return { points: [], maxVal: 1, minAge: 30, maxAge: 85, width: w, height: h, padding: pad };
    }

    const minA = trajectory[0].age;
    const maxA = trajectory[trajectory.length - 1].age;

    let peak = 0;
    trajectory.forEach((t) => {
      peak = Math.max(
        peak,
        Number(t.real_portfolio) || 0,
        Number(t.coast_fi_target) || 0,
        Number(t.real_full_fi_target) || 0
      );
    });
    // Add 15% headroom
    peak = peak > 0 ? peak * 1.15 : 1000000;

    const scaleX = (age: number) => {
      const denom = maxA - minA || 1;
      return pad.left + ((age - minA) / denom) * (w - pad.left - pad.right);
    };

    const scaleY = (val: number) => {
      const clamped = Math.max(0, val);
      return h - pad.bottom - (clamped / peak) * (h - pad.top - pad.bottom);
    };

    const pts = trajectory.map((t, idx) => ({
      idx,
      age: t.age,
      year: t.year,
      x: scaleX(t.age),
      realPortY: scaleY(Number(t.real_portfolio) || 0),
      coastTargetY: scaleY(Number(t.coast_fi_target) || 0),
      fullFiTargetY: scaleY(Number(t.real_full_fi_target) || 0),
      raw: t,
    }));

    return {
      points: pts,
      maxVal: peak,
      minAge: minA,
      maxAge: maxA,
      width: w,
      height: h,
      padding: pad,
    };
  }, [trajectory]);

  if (!points || points.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        No trajectory data available.
      </div>
    );
  }

  // Paths construction
  const portfolioPath = points.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.realPortY}`,
    ""
  );

  const portfolioAreaPath = `${portfolioPath} L ${points[points.length - 1].x} ${
    height - padding.bottom
  } L ${points[0].x} ${height - padding.bottom} Z`;

  const coastPath = points.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.coastTargetY}`,
    ""
  );

  const fullFiTargetY = points[0]?.fullFiTargetY ?? padding.top;

  // Markers
  const goalX =
    padding.left +
    ((goalAge - minAge) / (maxAge - minAge || 1)) * (width - padding.left - padding.right);

  const fullFiX =
    fullFiAge && fullFiAge >= minAge && fullFiAge <= maxAge
      ? padding.left +
        ((fullFiAge - minAge) / (maxAge - minAge || 1)) *
          (width - padding.left - padding.right)
      : null;

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="ios-glass-card rounded-[28px] p-5 border border-white/[0.08] relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Portfolio Trajectory Curve
          </h3>
          <p className="text-xs text-slate-400">
            Real purchasing power growth against Coast FI threshold & Full FI target
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.6)]" />
            <span>Projected Portfolio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-cyan-400" />
            <span>Coast FI Threshold</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dotted border-amber-400" />
            <span>Real FI Target</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[650px] select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="pinkAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f472b6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((pct) => {
            const y = height - padding.bottom - pct * (height - padding.top - padding.bottom);
            const val = pct * maxVal;
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
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-500 text-[9px] font-mono"
                >
                  {formatCurrency(val)}
                </text>
              </g>
            );
          })}

          {/* Horizontal FI Target Reference Line */}
          <line
            x1={padding.left}
            y1={fullFiTargetY}
            x2={width - padding.right}
            y2={fullFiTargetY}
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            opacity="0.8"
          />

          {/* Vertical Goal Age Reference Line */}
          {goalX >= padding.left && goalX <= width - padding.right && (
            <g>
              <line
                x1={goalX}
                y1={padding.top}
                x2={goalX}
                y2={height - padding.bottom}
                stroke="rgba(255,255,255,0.25)"
                strokeDasharray="4 4"
              />
              <text
                x={goalX}
                y={padding.top - 8}
                textAnchor="middle"
                className="fill-slate-300 text-[10px] font-bold"
              >
                Goal Age: {goalAge}
              </text>
            </g>
          )}

          {/* Vertical Full FI Age Reference Line */}
          {fullFiX && (
            <g>
              <line
                x1={fullFiX}
                y1={padding.top}
                x2={fullFiX}
                y2={height - padding.bottom}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text
                x={fullFiX}
                y={height - padding.bottom + 26}
                textAnchor="middle"
                className="fill-emerald-400 text-[10px] font-bold"
              >
                FI Age: {fullFiAge}
              </text>
            </g>
          )}

          {/* Coast FI Curve */}
          <path
            d={coastPath}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeDasharray="4 3"
            opacity="0.85"
          />

          {/* Portfolio Area Fill */}
          <path d={portfolioAreaPath} fill="url(#pinkAreaGrad)" />

          {/* Portfolio Growth Curve */}
          <path
            d={portfolioPath}
            fill="none"
            stroke="#f472b6"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* X Axis labels */}
          {points
            .filter((_, idx) => idx % Math.ceil(points.length / 8) === 0)
            .map((pt) => (
              <text
                key={pt.age}
                x={pt.x}
                y={height - padding.bottom + 16}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-mono"
              >
                Age {pt.age}
              </text>
            ))}

          {/* Invisible hover trigger columns */}
          {points.map((pt) => (
            <rect
              key={pt.idx}
              x={pt.x - 12}
              y={padding.top}
              width={24}
              height={height - padding.top - padding.bottom}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(pt.idx)}
            />
          ))}

          {/* Active Hover Cursor & Indicator Dots */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={height - padding.bottom}
                stroke="rgba(244,114,182,0.5)"
                strokeWidth="1.5"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.realPortY}
                r="5"
                fill="#f472b6"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.coastTargetY}
                r="4"
                fill="#22d3ee"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Hover Info Tooltip Bar */}
      {activePoint && (
        <div className="mt-3 ios-callout-info flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Age & Year: </span>
            <span className="font-bold text-white">
              {activePoint.age} yrs ({activePoint.year})
            </span>
          </div>

          <div>
            <span className="text-pink-400 font-medium">Projected Portfolio: </span>
            <span className="font-bold text-white">
              {formatCurrency(activePoint.raw.real_portfolio)}
            </span>
          </div>

          <div>
            <span className="text-cyan-400 font-medium">Coast FI Threshold: </span>
            <span className="font-bold text-white">
              {formatCurrency(activePoint.raw.coast_fi_target)}
            </span>
          </div>

          <div>
            <span className="text-amber-400 font-medium">Target Nest Egg: </span>
            <span className="font-bold text-white">
              {formatCurrency(activePoint.raw.real_full_fi_target)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
