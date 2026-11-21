"use client";

import React, { useState, useMemo, useId, useRef, useEffect } from "react";
import { formatCompactWithSymbol, formatPercent } from "@/lib/format";
import { COPY } from "@/constants/copy";
import { GlassTooltip } from "@/components/ui/GlassTooltip";
import { Inbox } from "lucide-react";

export interface TreemapHolding {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  value: number; // Normalized in base currency
  amount: number | string;
  currency: string;
  isDiffCurrency?: boolean;
  raw?: unknown;
}

export interface TreemapCategoryData {
  category: string;
  totalValue: number;
  percentage: number;
  color: {
    hex: string;
    dot: string;
    bgTint: string;
    borderTint: string;
    gradient: string;
    text: string;
  };
  holdings: TreemapHolding[];
}

export interface GlassTreemapProps {
  categories: TreemapCategoryData[];
  portfolioTotal: number;
  currencySymbol: string;
  baseCurrency: string;
  height?: number;
  emptyMessage?: string;
  className?: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LayoutTile {
  holding: TreemapHolding;
  category: TreemapCategoryData;
  rect: Rect;
  catShare: number;
  portShare: number;
}

interface LayoutCategory {
  category: TreemapCategoryData;
  rect: Rect;
  tiles: LayoutTile[];
}

/**
 * Bruls-Huizing-van Wijk Squarified Treemap Layout Algorithm.
 * Recursively creates rectangles with optimal aspect ratios close to 1:1.
 */
function squarify(
  items: { id: string; val: number }[],
  bounds: Rect
): Map<string, Rect> {
  const result = new Map<string, Rect>();
  if (!items || items.length === 0 || bounds.w <= 0 || bounds.h <= 0) {
    return result;
  }

  const validItems = items.filter((it) => it.val > 0);
  if (validItems.length === 0) {
    return result;
  }

  const total = validItems.reduce((acc, it) => acc + it.val, 0);
  if (total <= 0) return result;

  const totalArea = bounds.w * bounds.h;
  const scale = totalArea / total;
  const scaled = validItems.map((it) => ({
    id: it.id,
    area: it.val * scale,
  }));

  let currentBox: Rect = { ...bounds };
  let row: { id: string; area: number }[] = [];

  const worstAspect = (rowItems: { area: number }[], side: number) => {
    if (rowItems.length === 0 || side <= 0) return Infinity;
    const sum = rowItems.reduce((acc, it) => acc + it.area, 0);
    if (sum <= 0) return Infinity;
    const maxArea = Math.max(...rowItems.map((it) => it.area));
    const minArea = Math.min(...rowItems.map((it) => it.area));
    const sideSq = side * side;
    const sumSq = sum * sum;
    return Math.max((sideSq * maxArea) / sumSq, sumSq / (sideSq * minArea));
  };

  const layoutRow = (rowItems: { id: string; area: number }[]) => {
    if (rowItems.length === 0) return;
    const side = Math.min(currentBox.w, currentBox.h);
    const sum = rowItems.reduce((acc, it) => acc + it.area, 0);
    const thickness = sum / side;

    if (currentBox.w <= currentBox.h) {
      // Row horizontal strip across currentBox.w
      let currentX = currentBox.x;
      for (const item of rowItems) {
        const itemW = (item.area / sum) * currentBox.w;
        result.set(item.id, {
          x: currentX,
          y: currentBox.y,
          w: itemW,
          h: thickness,
        });
        currentX += itemW;
      }
      currentBox = {
        x: currentBox.x,
        y: currentBox.y + thickness,
        w: currentBox.w,
        h: Math.max(0, currentBox.h - thickness),
      };
    } else {
      // Row vertical strip across currentBox.h
      let currentY = currentBox.y;
      for (const item of rowItems) {
        const itemH = (item.area / sum) * currentBox.h;
        result.set(item.id, {
          x: currentBox.x,
          y: currentY,
          w: thickness,
          h: itemH,
        });
        currentY += itemH;
      }
      currentBox = {
        x: currentBox.x + thickness,
        y: currentBox.y,
        w: Math.max(0, currentBox.w - thickness),
        h: currentBox.h,
      };
    }
  };

  for (let i = 0; i < scaled.length; i++) {
    const item = scaled[i];
    const side = Math.min(currentBox.w, currentBox.h);
    if (side <= 0) break;

    const currentWorst = worstAspect(row, side);
    const candidateRow = [...row, item];
    const candidateWorst = worstAspect(candidateRow, side);

    if (row.length === 0 || candidateWorst <= currentWorst) {
      row = candidateRow;
    } else {
      layoutRow(row);
      row = [item];
    }
  }

  if (row.length > 0) {
    layoutRow(row);
  }

  return result;
}

export const GlassTreemap: React.FC<GlassTreemapProps> = ({
  categories,
  portfolioTotal,
  currencySymbol,
  baseCurrency,
  height: propHeight,
  emptyMessage = COPY.PORTFOLIO_TREEMAP.EMPTY_TITLE,
  className = "",
}) => {
  const chartId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredTile, setHoveredTile] = useState<LayoutTile | null>(null);

  // Dynamic dimensions observed from container to occupy 100% available space
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 500,
    height: propHeight || 280,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };

    updateSize();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({
            width: Math.round(width),
            height: Math.round(height),
          });
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [propHeight]);

  const { width, height } = dimensions;
  const categoryGap = 3;
  const holdingGap = 1.5;

  // Compute hierarchical layout based on exact available width and height
  const layout = useMemo<LayoutCategory[]>(() => {
    if (!categories || categories.length === 0 || portfolioTotal <= 0) {
      return [];
    }

    // 1. Squarify top-level categories
    const catItems = categories.map((cat) => ({
      id: cat.category,
      val: cat.totalValue,
    }));

    const catBounds: Rect = {
      x: categoryGap,
      y: categoryGap,
      w: Math.max(0, width - categoryGap * 2),
      h: Math.max(0, height - categoryGap * 2),
    };

    const catRects = squarify(catItems, catBounds);
    const result: LayoutCategory[] = [];

    for (const cat of categories) {
      const rawRect = catRects.get(cat.category);
      if (!rawRect || rawRect.w <= 0 || rawRect.h <= 0) continue;

      // Inset category rectangle
      const catRect: Rect = {
        x: rawRect.x + categoryGap / 2,
        y: rawRect.y + categoryGap / 2,
        w: Math.max(0, rawRect.w - categoryGap),
        h: Math.max(0, rawRect.h - categoryGap),
      };

      // Determine space for holdings
      const hasHeader = catRect.h >= 36 && catRect.w >= 50;
      const headerHeight = hasHeader ? 16 : 0;
      const innerMargin = 2;

      const innerBounds: Rect = {
        x: catRect.x + innerMargin,
        y: catRect.y + headerHeight + innerMargin,
        w: Math.max(0, catRect.w - innerMargin * 2),
        h: Math.max(0, catRect.h - headerHeight - innerMargin * 2),
      };

      const holdingItems = cat.holdings.map((h) => ({
        id: h.id,
        val: h.value,
      }));

      const holdingRects = squarify(holdingItems, innerBounds);
      const tiles: LayoutTile[] = [];

      for (const holding of cat.holdings) {
        const rawHRect = holdingRects.get(holding.id);
        if (!rawHRect || rawHRect.w <= 0 || rawHRect.h <= 0) continue;

        const tileRect: Rect = {
          x: rawHRect.x + holdingGap / 2,
          y: rawHRect.y + holdingGap / 2,
          w: Math.max(0, rawHRect.w - holdingGap),
          h: Math.max(0, rawHRect.h - holdingGap),
        };

        const catShare = cat.totalValue > 0 ? (holding.value / cat.totalValue) * 100 : 0;
        const portShare = portfolioTotal > 0 ? (holding.value / portfolioTotal) * 100 : 0;

        tiles.push({
          holding,
          category: cat,
          rect: tileRect,
          catShare,
          portShare,
        });
      }

      result.push({
        category: cat,
        rect: catRect,
        tiles,
      });
    }

    return result;
  }, [categories, portfolioTotal, width, height]);

  if (!categories || categories.length === 0 || portfolioTotal <= 0) {
    return (
      <div
        ref={containerRef}
        className={`w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 py-10 min-h-[220px] ${className}`}
      >
        <Inbox className="h-7 w-7 text-slate-500 opacity-60" />
        <span className="text-xs font-semibold">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-0 select-none overflow-hidden ${className}`}
    >
      <div className="relative w-full h-full overflow-visible">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full block"
          onMouseLeave={() => setHoveredTile(null)}
        >
          <defs>
            {/* Category background gradients */}
            {categories.map((cat, i) => {
              const gradId = `cat-grad-${chartId}-${i}`;
              return (
                <linearGradient
                  key={gradId}
                  id={gradId}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor={cat.color.hex} stopOpacity="0.45" />
                  <stop offset="100%" stopColor={cat.color.hex} stopOpacity="0.15" />
                </linearGradient>
              );
            })}

            {/* Glowing liquid filter */}
            <filter
              id={`treemap-glow-${chartId}`}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="2"
                floodColor="#ffffff"
                floodOpacity="0.4"
              />
            </filter>
          </defs>

          {/* Level 1: Category Outer Frames */}
          {layout.map((catLayout) => {
            const { category, rect } = catLayout;
            const hasHeader = rect.h >= 36 && rect.w >= 50;

            return (
              <g key={`cat-${category.category}`}>
                {/* Category container background */}
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.w}
                  height={rect.h}
                  rx="8"
                  ry="8"
                  fill="rgba(15, 23, 42, 0.45)"
                  stroke={category.color.hex}
                  strokeOpacity="0.25"
                  strokeWidth="1"
                />

                {/* Category Header Label */}
                {hasHeader && (
                  <g>
                    <circle
                      cx={rect.x + 8}
                      cy={rect.y + 9}
                      r="2.5"
                      fill={category.color.hex}
                    />
                    <text
                      x={rect.x + 15}
                      y={rect.y + 12}
                      className="text-[9px] font-bold fill-slate-200 uppercase tracking-wider select-none pointer-events-none"
                    >
                      {category.category}
                    </text>
                    {rect.w >= 85 && (
                      <text
                        x={rect.x + rect.w - 6}
                        y={rect.y + 12}
                        textAnchor="end"
                        className="text-[8.5px] font-mono font-medium fill-slate-400 select-none pointer-events-none"
                      >
                        {formatPercent(category.percentage, 0)}
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* Level 2: Child Holding Tiles */}
          {layout.flatMap((catLayout) =>
            catLayout.tiles.map((tile) => {
              const isHovered = hoveredTile?.holding.id === tile.holding.id;
              const isDimmed = hoveredTile !== null && !isHovered;
              const { rect, holding, category } = tile;

              // Horizontal & Vertical Center coordinates
              const centerX = rect.x + rect.w / 2;
              const centerY = rect.y + rect.h / 2;

              // Minimum dimensions to render text
              const canShow = rect.w >= 26 && rect.h >= 20;

              // Subtitle value string
              const subText = formatCompactWithSymbol(holding.value, baseCurrency);

              // Determine if spacious enough for 3 lines (multi-word title wrapping)
              const hasMultiWords = holding.name.includes(" ");
              const canWrapTitle = hasMultiWords && rect.h >= 58 && rect.w >= 60;

              // Scale font size based on box dimensions
              const availW = Math.max(0, rect.w - 6);
              const availH = Math.max(0, rect.h - 6);
              const heightFactor = canWrapTitle ? 3.5 : 2.3;
              const baseFont = Math.min(availW / 6.5, availH / heightFactor);
              const titleSize = Number(Math.max(7.5, Math.min(14, baseFont)).toFixed(1));
              const subSize = Number(Math.max(7, Math.min(11.5, titleSize * 0.85)).toFixed(1));
              const lineGap = Number(Math.max(2, Math.min(4.5, titleSize * 0.28)).toFixed(1));

              const maxChars = Math.max(4, Math.floor(availW / (titleSize * 0.58)));

              // Determine lines
              let line1 = "";
              let line2: string | null = null;

              if (canWrapTitle) {
                const words = holding.name.split(" ");
                let wLine1 = "";
                let wIdx = 0;
                for (; wIdx < words.length; wIdx++) {
                  const candidate = wLine1 ? `${wLine1} ${words[wIdx]}` : words[wIdx];
                  if (candidate.length <= maxChars) {
                    wLine1 = candidate;
                  } else {
                    break;
                  }
                }
                if (wLine1 && wIdx < words.length) {
                  line1 = wLine1;
                  const wLine2Raw = words.slice(wIdx).join(" ");
                  line2 =
                    wLine2Raw.length > maxChars
                      ? wLine2Raw.slice(0, maxChars - 1) + "…"
                      : wLine2Raw;
                } else {
                  line1 =
                    holding.name.length > maxChars
                      ? holding.name.slice(0, maxChars - 1) + "…"
                      : holding.name;
                }
              } else {
                line1 =
                  holding.name.length > maxChars
                    ? holding.name.slice(0, maxChars - 1) + "…"
                    : holding.name;
              }

              const hasThreeLines = line2 !== null;

              // Calculate exact vertical centers for dominantBaseline="central"
              let y1 = 0;
              let y2 = 0;
              let ySub = 0;

              if (hasThreeLines) {
                const totalH = titleSize * 2 + subSize + lineGap * 2;
                y1 = centerY - totalH / 2 + titleSize / 2;
                y2 = y1 + titleSize / 2 + lineGap + titleSize / 2;
                ySub = centerY + totalH / 2 - subSize / 2;
              } else {
                y1 = centerY - (titleSize * 0.5 + lineGap * 0.5);
                ySub = centerY + (subSize * 0.5 + lineGap * 0.5);
              }

              return (
                <g
                  key={`tile-${holding.id}`}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredTile(tile)}
                >
                  {/* Glass Holding Tile Body */}
                  <rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.w}
                    height={rect.h}
                    rx="5"
                    ry="5"
                    fill={category.color.hex}
                    fillOpacity={isHovered ? 0.6 : 0.22}
                    stroke={isHovered ? "#ffffff" : category.color.hex}
                    strokeOpacity={isHovered ? 0.85 : 0.35}
                    strokeWidth={isHovered ? 1.5 : 1}
                    opacity={isDimmed ? 0.4 : 1}
                    filter={isHovered ? `url(#treemap-glow-${chartId})` : undefined}
                    className="transition-all duration-150"
                  />

                  {/* Specular Highlight along top edge */}
                  {rect.w >= 10 && rect.h >= 10 && (
                    <line
                      x1={rect.x + 2}
                      y1={rect.y + 1}
                      x2={rect.x + rect.w - 2}
                      y2={rect.y + 1}
                      stroke="rgba(255, 255, 255, 0.35)"
                      strokeWidth="1"
                      strokeLinecap="round"
                      pointerEvents="none"
                    />
                  )}

                  {/* Center-aligned Title & Subtitle with dynamic scaling */}
                  {canShow && (
                    <g className="select-none pointer-events-none">
                      {/* Title Line 1 */}
                      <text
                        x={centerX}
                        y={y1}
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontSize: `${titleSize}px` }}
                        className="font-bold fill-white tracking-tight"
                      >
                        {line1}
                      </text>

                      {/* Title Line 2 (when wrapped across 3 lines) */}
                      {hasThreeLines && line2 && (
                        <text
                          x={centerX}
                          y={y2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          style={{ fontSize: `${titleSize}px` }}
                          className="font-bold fill-white tracking-tight"
                        >
                          {line2}
                        </text>
                      )}

                      {/* Subtitle / Formatted Balance Line */}
                      <text
                        x={centerX}
                        y={ySub}
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontSize: `${subSize}px` }}
                        className="font-mono font-medium fill-slate-300"
                      >
                        {subText}
                      </text>
                    </g>
                  )}
                </g>
              );
            })
          )}
        </svg>

        {/* Top-layer Portal Tooltip: rendered into document.body to prevent clipping by card overflow-hidden */}
        {(() => {
          let anchorX = 0;
          let anchorY = 0;
          if (hoveredTile && svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            const tileCenterX = hoveredTile.rect.x + hoveredTile.rect.w / 2;
            const tileCenterY = hoveredTile.rect.y + hoveredTile.rect.h / 2;
            anchorX = rect.left + (tileCenterX / width) * rect.width;
            anchorY = rect.top + (tileCenterY / height) * rect.height;
          }

          return (
            <GlassTooltip
              isOpen={hoveredTile !== null}
              anchorX={anchorX}
              anchorY={anchorY}
              offset={14}
            >
              {hoveredTile && (
                <div className="relative overflow-hidden rounded-2xl ios-glass p-3.5 border border-white/15 border-t-white/35 shadow-glass-glow backdrop-blur-2xl text-xs space-y-2 min-w-[190px]">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent pointer-events-none" />

                  {/* Tooltip Header */}
                  <div className="relative z-10 pb-1.5 border-b border-white/[0.08]">
                    <div className="font-bold text-white text-xs truncate">
                      {hoveredTile.holding.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: hoveredTile.category.color.hex }}
                      />
                      <span className="text-[10px] text-slate-300 capitalize font-medium">
                        {hoveredTile.category.category}
                        {hoveredTile.holding.subCategory &&
                          hoveredTile.holding.subCategory !== hoveredTile.category.category &&
                          ` • ${hoveredTile.holding.subCategory}`}
                      </span>
                    </div>
                  </div>

                  {/* Value & Shares */}
                  <div className="relative z-10 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400 font-medium">
                        {COPY.PORTFOLIO_TREEMAP.TOOLTIP_CONVERTED}:
                      </span>
                      <span className="font-black text-white font-mono">
                        {currencySymbol}
                        {formatCompactWithSymbol(hoveredTile.holding.value, baseCurrency)}
                      </span>
                    </div>

                    {hoveredTile.holding.isDiffCurrency && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-400 font-medium">
                          {COPY.PORTFOLIO_TREEMAP.TOOLTIP_BALANCE}:
                        </span>
                        <span className="font-bold text-slate-300 font-mono">
                          {formatCompactWithSymbol(
                            hoveredTile.holding.amount,
                            hoveredTile.holding.currency
                          )}
                        </span>
                      </div>
                    )}

                    <div className="pt-1 border-t border-white/[0.06] flex items-center justify-between gap-3 text-[10px]">
                      <span className="text-slate-400">
                        {COPY.PORTFOLIO_TREEMAP.TOOLTIP_SHARE_CATEGORY}:
                      </span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {formatPercent(hoveredTile.catShare, 1)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-[10px]">
                      <span className="text-slate-400">
                        {COPY.PORTFOLIO_TREEMAP.TOOLTIP_SHARE_PORTFOLIO}:
                      </span>
                      <span className="font-bold text-cyan-400 font-mono">
                        {formatPercent(hoveredTile.portShare, 1)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </GlassTooltip>
          );
        })()}
      </div>
    </div>
  );
};
