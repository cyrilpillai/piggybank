"use client";

import React from "react";
import { User, CurrencyItem } from "@/types";
import { LogOut } from "lucide-react";
import { PiggyLogo } from "@/components/ui/PiggyLogo";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { getCurrencySymbol } from "@/lib/format";

interface NavbarProps {
  user: User | null;
  baseCurrency: string;
  currencies: CurrencyItem[];
  onCurrencyChange: (code: string) => void;
  onLogout: () => void;
}

const getInitials = (name?: string | null): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Navbar: React.FC<NavbarProps> = ({
  user,
  baseCurrency,
  currencies,
  onCurrencyChange,
  onLogout,
}) => {
  const currencyOptions = currencies.map((c) => {
    const symbol = getCurrencySymbol(c.code);
    return {
      value: c.code,
      label: `${c.code} (${symbol})`,
      sublabel: c.name,
      symbol,
    };
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-slate-950/65 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 ios-icon-box ios-icon-box-pink">
            <PiggyLogo className="h-5 w-5 stroke-[2.2] text-pink-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white drop-shadow-sm">
                Piggybank
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-pink-300 font-medium">
              Personal Wealth OS
            </p>
          </div>
        </div>

        {/* Currency Switcher & User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Base Currency Liquid Glass Dropdown */}
          <GlassSelect
            value={baseCurrency}
            onChange={onCurrencyChange}
            options={currencyOptions}
            variant="pill"
            menuAlign="right"
          />

          {/* User profile & Logout */}
          {user && (
            <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-white/[0.08]">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-100">{user.name}</span>
                <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{user.email}</span>
              </div>
              {user.avatar_url ? (
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full p-[1px] bg-gradient-to-b from-white/35 via-white/10 to-transparent shadow-glass-sm ring-1 ring-inset ring-white/15">
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full ios-avatar-glass text-[11px] font-bold text-white shadow-glass-sm tracking-wider select-none ring-1 ring-inset ring-white/15"
                  title={user.name}
                >
                  <span className="drop-shadow-sm bg-gradient-to-br from-white via-slate-100 to-pink-200 bg-clip-text text-transparent">
                    {getInitials(user.name)}
                  </span>
                </div>
              )}
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-full transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
