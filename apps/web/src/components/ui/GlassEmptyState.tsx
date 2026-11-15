"use client";

import React from "react";

export interface GlassEmptyStateProps {
  icon: React.ReactNode;
  iconColor?: "pink" | "emerald" | "rose" | "cyan" | "amber" | "indigo" | "slate";
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  action?: React.ReactNode;
  variant?: "card" | "table" | "welcome";
  className?: string;
}

const ICON_BOX_MAP: Record<string, string> = {
  pink: "ios-icon-box-pink text-pink-400",
  emerald: "ios-icon-box-emerald text-emerald-400",
  rose: "ios-icon-box-rose text-rose-400",
  cyan: "ios-icon-box-cyan text-cyan-400",
  amber: "ios-icon-box-amber text-amber-400",
  indigo: "ios-icon-box-indigo text-indigo-400",
  slate: "text-slate-400",
};

export const GlassEmptyState: React.FC<GlassEmptyStateProps> = ({
  icon,
  iconColor = "pink",
  title,
  description,
  action,
  variant = "card",
  className = "",
}) => {
  const iconStyling = ICON_BOX_MAP[iconColor] || ICON_BOX_MAP.pink;

  if (variant === "table") {
    return (
      <div className={`p-12 text-center ios-table-card border border-white/[0.08] ${className}`}>
        <div className={`h-12 w-12 rounded-2xl ios-icon-box ${iconStyling} mx-auto mb-3`}>
          {icon}
        </div>
        <h4 className="text-sm font-bold text-white">{title}</h4>
        {description && (
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }

  if (variant === "welcome") {
    return (
      <div
        className={`ios-glass-card rounded-[32px] p-8 text-center max-w-lg mx-auto border border-white/10 space-y-4 my-8 shadow-ios-card ${className}`}
      >
        <div className={`h-16 w-16 mx-auto rounded-3xl ios-icon-box ${iconStyling} shadow-glass-glow`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-black text-white">{title}</h3>
          {description && (
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && <div className="pt-2">{action}</div>}
      </div>
    );
  }

  // Default "card" variant
  return (
    <div className={`ios-empty-state ${className}`}>
      <div className={`ios-empty-icon ${iconStyling}`}>
        {icon}
      </div>
      <h3 className="ios-empty-title">{title}</h3>
      {description && <p className="ios-empty-desc">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
