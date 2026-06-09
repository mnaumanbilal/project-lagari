"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type AdminToastContextValue = {
  toasts: Toast[];
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: string) => void;
};

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

const AUTO_DISMISS_MS = 5200;

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, variant }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const actions = useMemo(
    () => ({
      toast: push,
      success: (m: string) => push(m, "success"),
      error: (m: string) => push(m, "error"),
      warning: (m: string) => push(m, "warning"),
      info: (m: string) => push(m, "info"),
      dismiss,
    }),
    [push, dismiss],
  );

  const value = useMemo(
    () => ({
      toasts,
      ...actions,
    }),
    [toasts, actions],
  );

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      <AdminToastViewport toasts={toasts} onDismiss={dismiss} />
    </AdminToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(AdminToastContext);
  if (!ctx) {
    throw new Error("useAdminToast must be used within AdminToastProvider");
  }
  return ctx;
}

function AdminToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (!toasts.length) return null;

  const styles: Record<ToastVariant, string> = {
    success: "border-lagari-success/40 bg-lagari-elevated text-lagari-primary",
    error: "border-lagari-danger/50 bg-lagari-elevated text-lagari-primary",
    warning: "border-lagari-brass/50 bg-lagari-elevated text-lagari-primary",
    info: "border-lagari-border bg-lagari-elevated text-lagari-primary",
  };

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto rounded-sm border px-4 py-3 text-sm shadow-lg ${styles[t.variant]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{t.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="shrink-0 text-lagari-muted hover:text-lagari-primary"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
