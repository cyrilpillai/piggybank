"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";
import { COPY } from "@/constants/copy";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = COPY.COMMON.CONFIRM_ACTION,
  description = COPY.COMMON.CONFIRM_DESC,
  confirmText = COPY.COMMON.DELETE,
  cancelText = COPY.COMMON.CANCEL,
  isDestructive = true,
  isLoading = false,
  error = null,
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 ios-modal-backdrop animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md my-8 ios-modal-card p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close dialog"
          className="absolute top-5 right-5 ios-modal-close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Themed Icon Badge */}
        <div className="text-center pt-1">
          <div
            className={`h-14 w-14 rounded-2xl mx-auto flex items-center justify-center shadow-sm ios-icon-box ${
              isDestructive ? "ios-icon-box-rose" : "ios-icon-box-pink"
            }`}
          >
            {isDestructive ? (
              <Trash2 className="h-7 w-7 stroke-[2.2]" />
            ) : (
              <AlertTriangle className="h-7 w-7 stroke-[2.2]" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-2">
          <h3
            id="confirm-dialog-title"
            className="text-lg font-bold text-white tracking-tight"
          >
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        </div>

        {/* Error message banner */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs shadow-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-2xl ios-btn-secondary text-xs sm:text-sm font-semibold transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 ${
              isDestructive ? "ios-btn-danger" : "ios-btn-primary"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{COPY.COMMON.DELETING}</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
