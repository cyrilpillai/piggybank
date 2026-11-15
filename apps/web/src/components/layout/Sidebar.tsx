"use client";

import React from "react";
import { LayoutDashboard, TrendingUp, TrendingDown, Sparkles, Flame } from "lucide-react";

export type TabType = "dashboard" | "assets" | "liabilities" | "fire";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  assetCount: number;
  liabilityCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  assetCount,
  liabilityCount,
}) => {
  const navItems = [
    {
      id: "dashboard" as TabType,
      label: "Overview",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "assets" as TabType,
      label: "Assets Ledger",
      icon: TrendingUp,
      badge: assetCount,
    },
    {
      id: "liabilities" as TabType,
      label: "Debts & Loans",
      icon: TrendingDown,
      badge: liabilityCount,
    },
    {
      id: "fire" as TabType,
      label: "FIRE Planner",
      icon: Flame,
      badge: null,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-white/[0.08] bg-slate-950/40 backdrop-blur-2xl p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-white/10 text-white border border-white/20 shadow-glass-sm backdrop-blur-xl ring-1 ring-inset ring-white/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition ${
                    isActive ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]" : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span className="ios-badge ios-badge-neutral text-[10px]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Helpful Piggy AI Assistant Future Teaser */}
      <div className="mt-auto pt-6">
        <div className="ios-glass-card rounded-[22px] p-4 space-y-2 border border-pink-500/20 bg-gradient-to-b from-pink-500/[0.05] to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-pink-400">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Piggy AI</span>
            </div>
            <span className="ios-badge ios-badge-pink text-[10px]">
              Coming Soon
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Your AI financial companion is training! Soon it will analyze portfolio drift, sniff out hidden fees, and celebrate savings milestones.
          </p>
        </div>
      </div>
    </aside>
  );
};
