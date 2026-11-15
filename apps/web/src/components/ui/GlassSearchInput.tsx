"use client";

import React from "react";
import { Search, X } from "lucide-react";

export interface GlassSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  autoFocus?: boolean;
}

export const GlassSearchInput: React.FC<GlassSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  id,
  autoFocus,
}) => {
  return (
    <div className={`relative flex-1 max-w-md ${className}`}>
      <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-9 pr-9 py-2 rounded-2xl ios-glass-input text-xs text-white placeholder-slate-400 focus:outline-none transition-all duration-200"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-white transition"
          title="Clear search"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
