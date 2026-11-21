"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

export interface GlassTooltipProps {
  isOpen: boolean;
  anchorX: number;
  anchorY: number;
  offset?: number;
  children: React.ReactNode;
  className?: string;
}

export const GlassTooltip: React.FC<GlassTooltipProps> = ({
  isOpen,
  anchorX,
  anchorY,
  offset = 12,
  children,
  className = "",
}) => {
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    left: anchorX,
    top: anchorY,
    transform: "translate(0, -50%)",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 210;
    const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 110;
    const padding = 16;

    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // Horizontal positioning: default to right of anchor, flip to left if overflowing
    let left = anchorX + offset;
    let transformX = "0%";

    if (anchorX + offset + tooltipWidth > winW - padding) {
      left = anchorX - offset;
      transformX = "-100%";
    }

    // If flipped left still overflows left edge of window
    if (transformX === "-100%" && left - tooltipWidth < padding) {
      left = padding + tooltipWidth;
    }

    // Vertical positioning: centered on anchor, clamped within window view
    let top = anchorY;
    let transformY = "-50%";

    const halfH = tooltipHeight / 2;
    if (top - halfH < padding) {
      top = padding;
      transformY = "0%";
    } else if (top + halfH > winH - padding) {
      top = winH - padding;
      transformY = "-100%";
    }

    setPosition({
      left,
      top,
      transform: `translate(${transformX}, ${transformY})`,
    });
  }, [isOpen, anchorX, anchorY, offset]);

  if (!mounted || !isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={tooltipRef}
      className={`fixed z-[9999] pointer-events-none transition-all duration-75 ease-out animate-in fade-in zoom-in-95 ${className}`}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        transform: position.transform,
      }}
    >
      {children}
    </div>,
    document.body
  );
};
