"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import {
  convertToBaseCurrency,
  getCurrencySymbol,
  registerSupportedCurrencies,
  getRegisteredCurrencies,
} from "@/lib/format";
import {
  trackCurrencyChange,
  trackAddAsset,
  trackAddLiability,
} from "@/lib/analytics";
import { User, Asset, Liability, DashboardResponse, CurrencyItem, FireScenario } from "@/types";

// Layout components
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar, TabType } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

// Views & Modals
import { LoginView } from "@/components/auth/LoginView";
import { NetWorthCard } from "@/components/dashboard/NetWorthCard";
import { NetWorthTrendCard } from "@/components/dashboard/NetWorthTrendCard";
import { PortfolioTreemapCard } from "@/components/dashboard/PortfolioTreemapCard";
import { HoldingsBarChartCard } from "@/components/dashboard/HoldingsBarChartCard";
import { CategoryBreakdownCard } from "@/components/dashboard/CategoryBreakdownCard";
import { FireOverviewCard } from "@/components/dashboard/FireOverviewCard";
import { AssetList } from "@/components/assets/AssetList";
import { AssetModal } from "@/components/assets/AssetModal";
import { LiabilityList } from "@/components/liabilities/LiabilityList";
import { LiabilityModal } from "@/components/liabilities/LiabilityModal";
import { FireView } from "@/components/fire/FireView";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PiggyLogo } from "@/components/ui/PiggyLogo";
import { COPY } from "@/constants/copy";

import {
  TrendingUp,
  TrendingDown,
  Plus,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
} from "lucide-react";

export default function HomePage() {
  // --- Auth & User State ---
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // --- Active View & Currencies ---
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [baseCurrency, setBaseCurrency] = useState<string>("INR");
  const [currencies, setCurrencies] = useState<CurrencyItem[]>(() => getRegisteredCurrencies());
  const [rates, setRates] = useState<Record<string, number>>({});

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "dashboard") {
      loadAppData();
    }
  };

  // --- Data State ---
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [primaryFireScenario, setPrimaryFireScenario] = useState<FireScenario | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState<number>(0);

  // --- Modal States ---
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [isLiabilityModalOpen, setIsLiabilityModalOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // --- Delete Confirmation Modal State ---
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: "asset" | "liability";
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Currency symbol lookup (centralized)
  const currentSymbol = getCurrencySymbol(baseCurrency);

  // Top 3 assets ranked by normalized amount in base currency
  const topAssets = useMemo(() => {
    return [...assets]
      .sort((a, b) => {
        const valA = convertToBaseCurrency(a.amount, a.currency, baseCurrency, rates);
        const valB = convertToBaseCurrency(b.amount, b.currency, baseCurrency, rates);
        return valB - valA;
      })
      .slice(0, 3);
  }, [assets, baseCurrency, rates]);

  // Top 3 liabilities ranked by normalized amount in base currency
  const topLiabilities = useMemo(() => {
    return [...liabilities]
      .sort((a, b) => {
        const valA = convertToBaseCurrency(a.amount, a.currency, baseCurrency, rates);
        const valB = convertToBaseCurrency(b.amount, b.currency, baseCurrency, rates);
        return valB - valA;
      })
      .slice(0, 3);
  }, [liabilities, baseCurrency, rates]);

  // --- Load Supported Currencies ---
  const loadCurrencies = async () => {
    try {
      const list = await api.getSupportedCurrencies();
      if (list && list.length > 0) {
        registerSupportedCurrencies(list);
        setCurrencies(list);
      }
    } catch {
      // Keep cached currencies on error
    }
  };

  // --- Fetch Core Dashboard, Ledger & FIRE Data ---
  const loadAppData = useCallback(
    async (currencyToUse?: string) => {
      const curr = currencyToUse || baseCurrency;
      setErrorMessage(null);
      try {
        const [dashRes, assetRes, liabRes, ratesRes, fireScenarios] = await Promise.all([
          api.getDashboard(curr),
          api.getAssets(),
          api.getLiabilities(),
          api.getExchangeRates(curr).catch(() => ({ base: curr, rates: {} })),
          api.getFireScenarios().catch(() => []),
        ]);
        setDashboard(dashRes);
        setAssets(assetRes || []);
        setLiabilities(liabRes || []);
        if (ratesRes?.rates) {
          setRates(ratesRes.rates);
        }
        setHistoryRefreshTrigger((prev) => prev + 1);

        // Fetch active/default FIRE scenario metrics for the Overview card
        if (fireScenarios && fireScenarios.length > 0) {
          const defaultId = fireScenarios.find((s) => s.is_default)?.id || fireScenarios[0].id;
          try {
            const fullScenario = await api.getFireScenario(defaultId);
            setPrimaryFireScenario(fullScenario);
          } catch {
            setPrimaryFireScenario(null);
          }
        } else {
          setPrimaryFireScenario(null);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : COPY.OVERVIEW.ERROR_LOAD;
        setErrorMessage(msg);
      }
    },
    [baseCurrency]
  );

  // --- Auth Bootstrapping ---
  useEffect(() => {
    loadCurrencies();

    const savedUser = api.getSavedUser();
    const hasToken = api.isAuthenticated();

    if (hasToken && savedUser) {
      setUser(savedUser);
      setIsAuthenticated(true);
      const userCurrency = savedUser.base_currency || "INR";
      setBaseCurrency(userCurrency);
      loadAppData(userCurrency);

      // Verify token in background
      api
        .getCurrentUser()
        .then((fresh) => {
          setUser(fresh);
          if (fresh.base_currency && fresh.base_currency !== userCurrency) {
            setBaseCurrency(fresh.base_currency);
            loadAppData(fresh.base_currency);
          }
        })
        .catch(() => {
          // Token expired or invalid
          setUser(null);
          setIsAuthenticated(false);
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else {
      setIsInitializing(false);
    }

    const handleAuthLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
      setDashboard(null);
      setAssets([]);
      setLiabilities([]);
    };

    window.addEventListener("auth_logout", handleAuthLogout);
    return () => {
      window.removeEventListener("auth_logout", handleAuthLogout);
    };
  }, [loadAppData]);

  // --- Currency Change Handler ---
  const handleCurrencyChange = async (newCode: string) => {
    trackCurrencyChange(newCode);
    setBaseCurrency(newCode);
    if (user) {
      try {
        const updated = await api.updateUserPreferences(newCode);
        setUser(updated);
      } catch {
        // Silently continue with local switch
      }
    }
    loadAppData(newCode);
  };

  // --- Logout Handler ---
  const handleLogout = () => {
    api.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // --- Login Success Handler ---
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAuthenticated(true);
    loadCurrencies();
    const curr = loggedInUser.base_currency || "INR";
    setBaseCurrency(curr);
    loadAppData(curr);
  };

  // --- Asset CRUD ---
  const handleSaveAsset = async (assetData: Partial<Asset>) => {
    if (editingAsset) {
      await api.updateAsset(editingAsset.id, assetData);
    } else {
      await api.createAsset(assetData);
      trackAddAsset(assetData.category || "other", assetData.currency || baseCurrency);
    }
    setIsAssetModalOpen(false);
    setEditingAsset(null);
    await loadAppData();
  };

  const handleDeleteAsset = (id: string) => {
    const item = assets.find((a) => a.id === id);
    setDeleteError(null);
    setDeleteTarget({
      id,
      type: "asset",
      name: item?.name || "this asset",
    });
  };

  // --- Liability CRUD ---
  const handleSaveLiability = async (liabilityData: Partial<Liability>) => {
    if (editingLiability) {
      await api.updateLiability(editingLiability.id, liabilityData);
    } else {
      await api.createLiability(liabilityData);
      trackAddLiability(liabilityData.category || "other", liabilityData.currency || baseCurrency);
    }
    setIsLiabilityModalOpen(false);
    setEditingLiability(null);
    await loadAppData();
  };

  const handleDeleteLiability = (id: string) => {
    const item = liabilities.find((l) => l.id === id);
    setDeleteError(null);
    setDeleteTarget({
      id,
      type: "liability",
      name: item?.name || "this liability",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (deleteTarget.type === "asset") {
        await api.deleteAsset(deleteTarget.id);
      } else {
        await api.deleteLiability(deleteTarget.id);
      }
      setDeleteTarget(null);
      await loadAppData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to delete ${deleteTarget.type}`;
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Initial loading screen with frosted glass
  if (isInitializing) {
    return (
      <div className="relative flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-200 overflow-hidden">
        <div className="liquid-mesh-container">
          <div className="liquid-orb-piggy animate-float-slow" />
          <div className="liquid-orb-teal animate-float-reverse" />
        </div>
        <div className="relative z-10 p-8 rounded-[32px] ios-glass-card flex flex-col items-center gap-4 shadow-ios-card">
          <div className="h-14 w-14 rounded-2xl ios-icon-box ios-icon-box-pink">
            <PiggyLogo className="h-7 w-7 stroke-[2.4] text-pink-400 animate-pulse" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            {COPY.APP.LOADING}
          </span>
          <Loader2 className="h-5 w-5 animate-spin text-pink-400" />
        </div>
      </div>
    );
  }

  // Unauthenticated screen
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Fallback summary when not loaded yet
  const summary = dashboard?.summary || {
    base_currency: baseCurrency,
    total_assets: 0,
    total_liabilities: 0,
    net_worth: 0,
    debt_to_asset_ratio: 0,
    asset_count: assets.length,
    liability_count: liabilities.length,
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white overflow-x-hidden">
      {/* Background Liquid Ambient Light Orbs */}
      <div className="liquid-mesh-container">
        <div className="liquid-orb-piggy animate-float-slow" />
        <div className="liquid-orb-teal animate-float-reverse" />
        <div className="liquid-orb-indigo animate-pulse-subtle" />
      </div>

      {/* Top Floating Glass Navigation */}
      <Navbar
        user={user}
        baseCurrency={baseCurrency}
        currencies={currencies}
        onCurrencyChange={handleCurrencyChange}
        onLogout={handleLogout}
      />

      <div className="relative z-10 flex-1 flex flex-row">
        {/* Desktop Frosted Glass Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          assetCount={assets.length}
          liabilityCount={liabilities.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full mb-20 md:mb-0">
          {/* Global Error Banner */}
          {errorMessage && (
            <div className="mb-6 flex items-center justify-between p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => loadAppData()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 font-semibold transition"
              >
                <RefreshCw className="h-3 w-3" />
                <span>{COPY.COMMON.RETRY}</span>
              </button>
            </div>
          )}

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 sm:space-y-8">
              {/* Primary Net Worth Hero Card */}
              <NetWorthCard
                summary={summary}
                currencySymbol={currentSymbol}
                onAddAsset={() => {
                  setEditingAsset(null);
                  setIsAssetModalOpen(true);
                }}
                onAddLiability={() => {
                  setEditingLiability(null);
                  setIsLiabilityModalOpen(true);
                }}
              />

              {/* Primary FIRE Coast & Full FI Timeline Card */}
              <FireOverviewCard
                scenario={primaryFireScenario}
                currencySymbol={currentSymbol}
                baseCurrency={baseCurrency}
                onOpenFire={() => setActiveTab("fire")}
              />

              {/* Asset & Liability Category Breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <CategoryBreakdownCard
                  title={COPY.CATEGORIES.ASSET_TITLE}
                  type="asset"
                  categories={dashboard?.asset_categories || []}
                  currencySymbol={currentSymbol}
                  baseCurrency={baseCurrency}
                  items={assets}
                  rates={rates}
                  onAddItem={() => {
                    setEditingAsset(null);
                    setIsAssetModalOpen(true);
                  }}
                />

                <CategoryBreakdownCard
                  title={COPY.CATEGORIES.LIABILITY_TITLE}
                  type="liability"
                  categories={dashboard?.liability_categories || []}
                  currencySymbol={currentSymbol}
                  baseCurrency={baseCurrency}
                  items={liabilities}
                  rates={rates}
                  onAddItem={() => {
                    setEditingLiability(null);
                    setIsLiabilityModalOpen(true);
                  }}
                />
              </div>

              {/* Net Worth Trend Row (Left: Progression Line Chart, Right: Portfolio Diversification Treemap) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <NetWorthTrendCard
                  currencySymbol={currentSymbol}
                  baseCurrency={baseCurrency}
                  refreshTrigger={historyRefreshTrigger}
                />
                <PortfolioTreemapCard
                  assets={assets}
                  currencySymbol={currentSymbol}
                  baseCurrency={baseCurrency}
                  rates={rates}
                  onViewAll={() => setActiveTab("assets")}
                />
              </div>

              {/* Bottom Row: Individual Bar Chart Cards for Asset & Liability Holdings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <HoldingsBarChartCard
                  title={COPY.OVERVIEW.TOP_ASSETS}
                  type="asset"
                  items={assets}
                  currencySymbol={currentSymbol}
                  baseCurrency={baseCurrency}
                  rates={rates}
                  onViewAll={() => setActiveTab("assets")}
                />

                <HoldingsBarChartCard
                  title={COPY.OVERVIEW.TOP_LIABILITIES}
                  type="liability"
                  items={liabilities}
                  currencySymbol={currentSymbol}
                  baseCurrency={baseCurrency}
                  rates={rates}
                  onViewAll={() => setActiveTab("liabilities")}
                />
              </div>
            </div>
          )}

          {/* TAB 2: ASSETS LEDGER */}
          {activeTab === "assets" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {COPY.ASSETS.PAGE_TITLE}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    {COPY.ASSETS.PAGE_DESC}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingAsset(null);
                    setIsAssetModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl ios-btn-primary text-xs shadow-glass-glow"
                >
                  <Plus className="h-4 w-4 stroke-[2.8]" />
                  <span>{COPY.ASSETS.ADD_NEW}</span>
                </button>
              </div>

              <AssetList
                assets={assets}
                baseCurrency={baseCurrency}
                rates={rates}
                onEdit={(asset) => {
                  setEditingAsset(asset);
                  setIsAssetModalOpen(true);
                }}
                onDelete={handleDeleteAsset}
                onAddNew={() => {
                  setEditingAsset(null);
                  setIsAssetModalOpen(true);
                }}
              />
            </div>
          )}

          {/* TAB 3: LIABILITIES LEDGER */}
          {activeTab === "liabilities" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {COPY.LIABILITIES.PAGE_TITLE}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    {COPY.LIABILITIES.PAGE_DESC}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingLiability(null);
                    setIsLiabilityModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl ios-btn-primary text-xs shadow-glass-glow"
                >
                  <Plus className="h-4 w-4 stroke-[2.8]" />
                  <span>{COPY.LIABILITIES.ADD_NEW}</span>
                </button>
              </div>

              <LiabilityList
                liabilities={liabilities}
                baseCurrency={baseCurrency}
                rates={rates}
                onEdit={(liab) => {
                  setEditingLiability(liab);
                  setIsLiabilityModalOpen(true);
                }}
                onDelete={handleDeleteLiability}
                onAddNew={() => {
                  setEditingLiability(null);
                  setIsLiabilityModalOpen(true);
                }}
              />
            </div>
          )}

          {/* TAB 4: FIRE GOAL PLANNER */}
          {activeTab === "fire" && (
            <FireView
              user={user}
              baseCurrency={baseCurrency}
              currencySymbol={currentSymbol}
              onUserUpdated={(updated) => setUser(updated)}
              onScenarioUpdated={loadAppData}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* Quick Add Floating Picker for Mobile in Liquid Glass */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center ios-modal-backdrop p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm ios-modal-card p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="ios-modal-header">
              <h3 className="text-base font-bold text-white">{COPY.QUICK_ADD.TITLE}</h3>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="ios-modal-close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {COPY.QUICK_ADD.DESCRIPTION}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setEditingAsset(null);
                  setIsAssetModalOpen(true);
                }}
                className="flex flex-col items-center justify-center p-5 rounded-2xl ios-glass hover:bg-white/[0.1] border border-white/15 border-t-white/30 text-slate-100 transition-all duration-200 active:scale-95 group shadow-sm"
              >
                <div className="h-11 w-11 rounded-2xl ios-icon-box ios-icon-box-emerald mb-2 group-hover:scale-105 transition">
                  <TrendingUp className="h-5 w-5 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold">{COPY.QUICK_ADD.ADD_ASSET}</span>
              </button>

              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setEditingLiability(null);
                  setIsLiabilityModalOpen(true);
                }}
                className="flex flex-col items-center justify-center p-5 rounded-2xl ios-glass hover:bg-white/[0.1] border border-white/15 border-t-white/30 text-slate-100 transition-all duration-200 active:scale-95 group shadow-sm"
              >
                <div className="h-11 w-11 rounded-2xl ios-icon-box ios-icon-box-rose mb-2 group-hover:scale-105 transition">
                  <TrendingDown className="h-5 w-5 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold">{COPY.QUICK_ADD.ADD_LIABILITY}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AssetModal
        isOpen={isAssetModalOpen}
        onClose={() => {
          setIsAssetModalOpen(false);
          setEditingAsset(null);
        }}
        onSave={handleSaveAsset}
        editingAsset={editingAsset}
        currencies={currencies}
        defaultCurrency={baseCurrency}
      />

      <LiabilityModal
        isOpen={isLiabilityModalOpen}
        onClose={() => {
          setIsLiabilityModalOpen(false);
          setEditingLiability(null);
        }}
        onSave={handleSaveLiability}
        editingLiability={editingLiability}
        currencies={currencies}
        defaultCurrency={baseCurrency}
      />

      {/* Themed Confirmation Dialog for Ledger Entry Deletion */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.type === "asset" ? COPY.ASSETS.DELETE_TITLE : COPY.LIABILITIES.DELETE_TITLE}
        description={
          deleteTarget?.type === "asset"
            ? COPY.ASSETS.DELETE_DESC
            : COPY.LIABILITIES.DELETE_DESC
        }
        confirmText={COPY.COMMON.DELETE_ENTRY}
        cancelText={COPY.COMMON.CANCEL}
        isDestructive={true}
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
