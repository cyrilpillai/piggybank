"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  icon?: React.ReactNode;
  iconColor?: "pink" | "emerald" | "rose" | "cyan" | "amber" | "indigo" | "slate";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  error?: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerRight?: React.ReactNode;
  hideCloseButton?: boolean;
  dismissible?: boolean;
  className?: string;
  bodyClassName?: string;
  ariaLabel?: string;
}

const MAX_WIDTH_MAP: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-2xl md:max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
};

const ICON_COLOR_MAP: Record<string, string> = {
  pink: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  slate: "text-slate-300",
};

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  iconColor = "pink",
  maxWidth = "3xl",
  error = null,
  children,
  footer,
  headerRight,
  hideCloseButton = false,
  dismissible = true,
  className = "",
  bodyClassName = "",
  ariaLabel,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && dismissible) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, dismissible, onClose]);

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (isOpen && mounted) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, mounted]);

  if (!isOpen || !mounted) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && dismissible) {
      onClose();
    }
  };

  const widthClass = MAX_WIDTH_MAP[maxWidth] || MAX_WIDTH_MAP["3xl"];
  const iconStyling = iconColor ? ICON_COLOR_MAP[iconColor] : "";
  const hasHeader = Boolean(title || icon || !hideCloseButton);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : ariaLabel || "Dialog"}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 ios-modal-backdrop animate-in fade-in duration-200 overflow-hidden"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${widthClass} my-auto max-h-[min(92vh,860px)] flex flex-col overflow-hidden ios-modal-card animate-in zoom-in-95 duration-150 shadow-ios-card ${className}`}
      >
          {/* Modal Header (Pinned at top) */}
          {hasHeader && (
            <div className="ios-modal-header px-6 sm:px-8 pt-5 sm:pt-6 pb-3.5 shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                {icon && (
                  <div className={`ios-modal-icon shrink-0 ${iconStyling}`}>
                    {icon}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {title && (
                    <h3 className="text-xl font-bold text-white tracking-tight truncate">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                      {description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {headerRight}
                {!hideCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="ios-modal-close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error Message Banner (Always visible under header) */}
          {error && (
            <div className="px-6 sm:px-8 pt-3.5 shrink-0">
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold shadow-sm animate-in fade-in">
                {error}
              </div>
            </div>
          )}

          {/* Modal Content (Scrollable) */}
          <div
            className={`flex-1 overflow-y-auto overscroll-contain min-h-0 px-6 sm:px-8 ${
              hasHeader ? "py-4 sm:py-5" : "pt-5 sm:pt-6 pb-4"
            } ${!footer ? "pb-6 sm:pb-8" : ""} ${bodyClassName}`}
          >
            {children}
          </div>

          {/* Modal Footer (Sticky / Pinned at bottom) */}
          {footer && (
            <div className="px-6 sm:px-8 py-3.5 sm:py-4 border-t border-white/[0.08] bg-slate-900/60 backdrop-blur-xl flex items-center justify-end gap-3 shrink-0 rounded-b-[32px]">
              {footer}
            </div>
          )}
        </div>
    </div>,
    document.body
  );
};
