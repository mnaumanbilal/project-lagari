"use client";

import { useState } from "react";
import {
  getNotificationPermission,
  isBrowserPushSupported,
  subscribeToOrderPush,
} from "@/lib/push/customer-push";
import { useSession } from "@/lib/session/session-context";

type Props = {
  orderNumber?: number | null;
};

export function CustomerPushPrompt({ orderNumber }: Props) {
  const { ensureSession } = useSession();
  const [status, setStatus] = useState<
    "idle" | "loading" | "enabled" | "denied" | "unsupported"
  >(() => {
    if (!isBrowserPushSupported()) return "unsupported";
    const perm = getNotificationPermission();
    if (perm === "granted") return "enabled";
    if (perm === "denied") return "denied";
    return "idle";
  });

  if (status === "unsupported") return null;

  if (status === "enabled") {
    return (
      <p className="mt-6 rounded-sm border border-lagari-border bg-lagari-surface/60 px-4 py-3 text-sm text-lagari-muted">
        Browser notifications are on
        {orderNumber != null ? ` for order #${orderNumber}` : ""}. We&apos;ll alert you when
        your order status changes.
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="mt-6 text-sm text-lagari-muted">
        Notifications are blocked in your browser. Enable them in site settings to get order
        updates here.
      </p>
    );
  }

  return (
    <div className="mt-8 rounded-sm border border-lagari-border bg-lagari-surface/60 px-5 py-5 text-left">
      <p className="font-label text-sm text-lagari-brass">Stay updated</p>
      <p className="mt-1 text-sm text-lagari-muted">
        Get browser alerts when your order is confirmed, shipped, or delivered — even if you
        close this tab.
      </p>
      <button
        type="button"
        disabled={status === "loading"}
        onClick={() => {
          void (async () => {
            setStatus("loading");
            try {
              const sessionId = await ensureSession();
              const result = await subscribeToOrderPush(sessionId);
              if (result === "granted") setStatus("enabled");
              else if (result === "denied") setStatus("denied");
              else setStatus("idle");
            } catch {
              setStatus("idle");
            }
          })();
        }}
        className="mt-4 rounded-sm border border-lagari-brass px-4 py-2.5 text-sm font-medium text-lagari-brass transition-colors hover:bg-lagari-brass hover:text-lagari-deep disabled:opacity-50"
      >
        {status === "loading" ? "Enabling…" : "Enable browser notifications"}
      </button>
    </div>
  );
}
