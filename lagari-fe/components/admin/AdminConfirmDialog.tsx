"use client";

import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  const confirmClass =
    variant === "destructive"
      ? "border border-lagari-danger/50 bg-lagari-danger/10 text-lagari-danger hover:bg-lagari-danger/20"
      : "border border-lagari-brass bg-lagari-brass/10 text-lagari-brass hover:bg-lagari-brass/20";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 text-left"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
    >
      <div className="admin-card w-full max-w-md p-6 text-left">
        <h3 id="admin-confirm-title" className="font-display text-lg font-semibold">
          {title}
        </h3>
        <div className="mt-2 text-sm text-lagari-muted">{description}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="admin-btn px-4 py-2 text-sm text-lagari-muted hover:text-lagari-primary disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`admin-btn rounded-sm px-4 py-2 text-sm disabled:opacity-50 ${confirmClass}`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
