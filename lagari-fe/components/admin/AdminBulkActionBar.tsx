"use client";

import type { ReactNode } from "react";

type Props = {
  selectedCount: number;
  onClear: () => void;
  children: ReactNode;
};

export function AdminBulkActionBar({ selectedCount, onClear, children }: Props) {
  if (selectedCount <= 0) return null;

  return (
    <div
      role="status"
      className="admin-card sticky bottom-4 z-20 mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-between gap-3 border border-lagari-brass/40 bg-lagari-surface/95 px-4 py-3 shadow-lg backdrop-blur-sm"
    >
      <p className="text-sm text-lagari-primary">
        <span className="font-semibold">{selectedCount}</span> selected
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <button
          type="button"
          onClick={onClear}
          className="admin-btn px-3 py-1.5 text-sm text-lagari-muted hover:text-lagari-primary"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
