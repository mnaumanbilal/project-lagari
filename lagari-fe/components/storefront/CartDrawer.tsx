"use client";

import { useEffect } from "react";
import { CartPanel } from "@/components/storefront/CartPanel";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CartDrawer({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-lagari-deep/70 backdrop-blur-sm"
        aria-label="Close bag"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-md flex-col border-l border-lagari-border bg-lagari-elevated shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
      >
        <div className="flex items-center justify-between border-b border-lagari-border px-5 py-4">
          <h2 className="font-display text-xl font-semibold text-lagari-primary">
            Your bag
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-lagari-border px-3 py-1.5 text-sm text-lagari-muted transition-colors hover:border-lagari-brass hover:text-lagari-brass"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <CartPanel showHeading={false} onCheckout={onClose} />
        </div>
      </aside>
    </div>
  );
}
