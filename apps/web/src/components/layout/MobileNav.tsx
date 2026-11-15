"use client";

import React from "react";
import { LayoutDashboard, TrendingUp, TrendingDown, Plus, Flame } from "lucide-react";
import { TabType } from "./Sidebar";

interface MobileNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onQuickAdd: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  onQuickAdd,
}) => {
  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 pointer-events-none flex justify-center">
      <nav className="pointer-events-auto w-full max-w-sm ios-glass-card rounded-[28px] px-4 py-2 shadow-ios-card">
        <div className="flex items-center justify-around">
          <button
            onClick={() => onTabChange("dashboard")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-[11px] font-semibold transition ${
              activeTab === "dashboard"
                ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => onTabChange("assets")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-[11px] font-semibold transition ${
              activeTab === "assets"
                ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span>Assets</span>
          </button>

          {/* Center Liquid Glass Floating Quick-Add Button */}
          <button
            onClick={onQuickAdd}
            aria-label="Add to Piggybank"
            className="flex h-12 w-12 items-center justify-center -translate-y-3 rounded-full ios-btn-primary shadow-ios-card border border-white/20 border-t-white/50 active:scale-95 transition-all duration-200"
          >
            <Plus className="h-6 w-6 stroke-[2.8]" />
          </button>

          <button
            onClick={() => onTabChange("liabilities")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-[11px] font-semibold transition ${
              activeTab === "liabilities"
                ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingDown className="h-5 w-5" />
            <span>Debts</span>
          </button>

          <button
            onClick={() => onTabChange("fire")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-[11px] font-semibold transition ${
              activeTab === "fire"
                ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Flame className="h-5 w-5" />
            <span>FIRE</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
