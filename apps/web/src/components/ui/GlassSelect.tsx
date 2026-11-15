"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  symbol?: string;
  icon?: React.ReactNode;
}

interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
  variant?: "input" | "pill";
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
  menuPlacement?: "bottom" | "top";
  menuAlign?: "left" | "right";
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  variant = "input",
  searchable,
  className = "",
  disabled = false,
  menuPlacement = "bottom",
  menuAlign = "left",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Normalize options to SelectOption objects
  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Auto-enable search when options list is large
  const isSearchActive = searchable ?? normalizedOptions.length > 8;

  const filteredOptions = isSearchActive && searchQuery.trim()
    ? normalizedOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.sublabel?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : normalizedOptions;

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    if (rect.width === 0 && rect.height === 0) return;

    // Approximate height or measured height if available
    const menuHeight = menuRef.current?.offsetHeight || 260;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement = menuPlacement;
    if (menuPlacement === "bottom") {
      if (spaceBelow < Math.min(menuHeight, 280) && spaceAbove > spaceBelow) {
        placement = "top";
      }
    } else if (menuPlacement === "top") {
      if (spaceAbove < Math.min(menuHeight, 280) && spaceBelow > spaceAbove) {
        placement = "bottom";
      }
    }

    const isPill = variant === "pill";
    const style: React.CSSProperties = {
      position: "fixed",
      zIndex: 99999,
    };

    if (placement === "top") {
      style.bottom = `${Math.max(8, viewportHeight - rect.top + 8)}px`;
    } else {
      style.top = `${Math.min(viewportHeight - 60, rect.bottom + 8)}px`;
    }

    if (isPill) {
      if (menuAlign === "right") {
        style.right = `${Math.max(8, viewportWidth - rect.right)}px`;
      } else {
        style.left = `${Math.max(8, Math.min(rect.left, viewportWidth - 240))}px`;
      }
    } else {
      style.left = `${Math.max(8, rect.left)}px`;
      style.width = `${rect.width}px`;
    }

    setMenuStyle(style);
  }, [menuPlacement, menuAlign, variant]);

  // Recalculate position on scroll (capture phase catches modal scroll) and resize
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Handle outside click (accounts for portaled menu)
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!menuRef.current || !menuRef.current.contains(target))
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      // Focus search if active
      if (isSearchActive) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSearchActive]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery("");
  };

  const isPill = variant === "pill";

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${isPill ? "" : "w-full"} ${
        isOpen ? "z-50" : "z-auto"
      } ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center justify-between text-left transition-all duration-200 select-none ${
          isPill
            ? "ios-glass-pill rounded-full px-3.5 py-1.5 text-xs text-slate-200 hover:text-white"
            : "w-full rounded-2xl ios-glass-input px-4 py-2.5 text-sm text-white"
        } ${
          isOpen
            ? "ring-2 ring-white/20 border-white/35 shadow-ios-card"
            : ""
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          {selectedOption?.symbol && (
            <span className="text-white/80 font-bold shrink-0">
              {selectedOption.symbol}
            </span>
          )}
          <span
            className={`min-w-0 truncate font-semibold ${
              selectedOption ? "text-white" : "text-slate-400"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.sublabel && (
            <span className="text-[11px] text-slate-400 shrink-0 hidden sm:inline">
              ({selectedOption.sublabel})
            </span>
          )}
        </div>

        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ease-out ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu (Floating Liquid Glass Sheet - Portaled to top-most z-axis) */}
      {isOpen && mounted && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={menuStyle}
          className={`${
            isPill ? "min-w-[220px] max-w-sm" : "min-w-[180px]"
          } ios-glass-sheet p-1.5 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-inset ring-white/10 shadow-2xl backdrop-blur-2xl`}
        >
          {/* Optional Search Input */}
          {isSearchActive && (
            <div className="p-1.5 border-b border-white/[0.08] mb-1">
              <div className="relative flex items-center">
                <Search className="h-3.5 w-3.5 text-pink-400/80 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-pink-500/70 focus:ring-1 focus:ring-pink-500/30 transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto space-y-1 p-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "bg-pink-500/15 text-pink-100 border border-pink-500/25 shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      {opt.symbol && (
                        <span className="font-bold text-white/80 w-5 shrink-0 text-center">
                          {opt.symbol}
                        </span>
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="whitespace-normal leading-tight text-slate-100">
                          {opt.label}
                        </span>
                        {opt.sublabel && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-pink-400 shrink-0 ml-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
