"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type StorefrontToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const StorefrontToastContext = createContext<StorefrontToastContextValue | null>(null);

const AUTO_DISMISS_MS = 5000;

export function StorefrontToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      // Keep at most 3 toasts at once to avoid stacking spam
      setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      success: (m: string) => push(m, "success"),
      error: (m: string) => push(m, "error"),
      info: (m: string) => push(m, "info"),
    }),
    [push],
  );

  return (
    <StorefrontToastContext.Provider value={value}>
      {children}
      <StorefrontToastViewport toasts={toasts} onDismiss={dismiss} />
    </StorefrontToastContext.Provider>
  );
}

export function useStorefrontToast() {
  const ctx = useContext(StorefrontToastContext);
  if (!ctx) throw new Error("useStorefrontToast must be used within StorefrontToastProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Viewport — renders in a portal-like fixed position
// ---------------------------------------------------------------------------

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success:
    "border-emerald-300/50 bg-white text-neutral-800 [.dark_&]:bg-neutral-900 [.dark_&]:text-neutral-100",
  error:
    "border-rose-300/60 bg-white text-neutral-800 [.dark_&]:bg-neutral-900 [.dark_&]:text-neutral-100",
  info:
    "border-neutral-300/60 bg-white text-neutral-700 [.dark_&]:bg-neutral-900 [.dark_&]:text-neutral-200",
};

const ICON: Record<ToastVariant, string> = {
  success: "✓",
  error: "✕",
  info: "i",
};

const ICON_STYLES: Record<ToastVariant, string> = {
  success: "text-emerald-600",
  error: "text-rose-500",
  info: "text-neutral-400",
};

function StorefrontToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-6 left-1/2 z-[200] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 rounded border px-4 py-3 text-sm shadow-lg ${VARIANT_STYLES[t.variant]}`}
        >
          <span
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${ICON_STYLES[t.variant]}`}
            aria-hidden="true"
          >
            {ICON[t.variant]}
          </span>
          <p className="flex-1 leading-snug">{t.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="shrink-0 text-neutral-400 hover:text-neutral-600"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
