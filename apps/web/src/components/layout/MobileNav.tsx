"use client";

import React from "react";
import { LayoutDashboard, TrendingUp, TrendingDown, Plus, Flame } from "lucide-react";
import { TabType } from "./Sidebar";
import { COPY } from "@/constants/copy";

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
    <div className="md:hidden fixed bottom-4 inset-x-3 z-40 pointer-events-none flex justify-center pb-[env(safe-area-inset-bottom)]">
      {/* Floating Apple Liquid Glass Capsule Navigation Bar */}
      <nav className="pointer-events-auto w-full max-w-sm rounded-full p-1.5 backdrop-blur-3xl bg-slate-950/45 border border-white/20 border-t-white/40 shadow-[0_20px_48px_-8px_rgba(0,0,0,0.7),inset_0_1px_1px_0_rgba(255,255,255,0.35),inset_0_-1px_2px_0_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between gap-1">
          {/* Tab 1: Overview */}
          <button
            onClick={() => onTabChange("dashboard")}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-full text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
              activeTab === "dashboard"
                ? "text-white bg-white/15 backdrop-blur-xl border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_2px_8px_rgba(0,0,0,0.3)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard
              className={`h-4.5 w-4.5 transition-transform duration-200 ${
                activeTab === "dashboard"
                  ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)] scale-105"
                  : ""
              }`}
            />
            <span className="leading-tight">{COPY.NAV.OVERVIEW}</span>
          </button>

          {/* Tab 2: Assets */}
          <button
            onClick={() => onTabChange("assets")}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-full text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
              activeTab === "assets"
                ? "text-white bg-white/15 backdrop-blur-xl border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_2px_8px_rgba(0,0,0,0.3)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp
              className={`h-4.5 w-4.5 transition-transform duration-200 ${
                activeTab === "assets"
                  ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)] scale-105"
                  : ""
              }`}
            />
            <span className="leading-tight">{COPY.NET_WORTH.ASSETS_COUNT}</span>
          </button>

          {/* Center Liquid Glass Floating Action Button */}
          <button
            onClick={onQuickAdd}
            aria-label={COPY.NAV.QUICK_ADD_ARIA}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-400 text-white shadow-[0_0_16px_rgba(244,114,182,0.65),inset_0_1px_1.5px_rgba(255,255,255,0.8)] border border-white/30 active:scale-90 transition-all duration-200 shrink-0"
          >
            <Plus className="h-5 w-5 stroke-[2.8]" />
          </button>

          {/* Tab 3: Liabilities */}
          <button
            onClick={() => onTabChange("liabilities")}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-full text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
              activeTab === "liabilities"
                ? "text-white bg-white/15 backdrop-blur-xl border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_2px_8px_rgba(0,0,0,0.3)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingDown
              className={`h-4.5 w-4.5 transition-transform duration-200 ${
                activeTab === "liabilities"
                  ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)] scale-105"
                  : ""
              }`}
            />
            <span className="leading-tight">{COPY.NAV.LIABILITIES}</span>
          </button>

          {/* Tab 4: FIRE */}
          <button
            onClick={() => onTabChange("fire")}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-full text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
              activeTab === "fire"
                ? "text-white bg-white/15 backdrop-blur-xl border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_2px_8px_rgba(0,0,0,0.3)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Flame
              className={`h-4.5 w-4.5 transition-transform duration-200 ${
                activeTab === "fire"
                  ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)] scale-105"
                  : ""
              }`}
            />
            <span className="leading-tight">{COPY.NAV.FIRE}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
