"use client";

import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AdminOrderStatusPatch } from "@/lib/api/admin";
import { usePatchAdminOrderStatus } from "@/lib/admin/hooks/use-admin-mutations";
import { useAdminToast } from "@/lib/admin/admin-toast-context";
import { ApiError } from "@/lib/api/client";
import {
  ORDER_STATUS_ACTIONS,
  isDestructiveStatus,
  orderStatusLabel,
  primaryNextAction,
  requiresFulfillment,
  restoresInventory,
  type OrderStatus,
} from "@/lib/admin/order-status";

type PendingAction = {
  status: OrderStatus;
  label: string;
};

type Props = {
  orderId: string;
  status: string;
  allowedNextStatuses?: string[];
  compact?: boolean;
};

export function AdminOrderStatusActions({
  orderId,
  status,
  allowedNextStatuses,
  compact = false,
}: Props) {
  const toast = useAdminToast();
  const statusMutation = usePatchAdminOrderStatus(orderId);
  const busy = statusMutation.isPending;
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [note, setNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const allowed = allowedNextStatuses ?? [];
  const actions = (ORDER_STATUS_ACTIONS[status as OrderStatus] ?? []).filter((action) =>
    allowed.length ? allowed.includes(action.status) : true,
  );

  const visibleActions = compact
    ? (() => {
        const primary = primaryNextAction(status, allowed);
        return primary ? [primary] : [];
      })()
    : actions;

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  function openAction(action: PendingAction) {
    setNote("");
    setCancelReason("");
    setCourierName("");
    setTrackingNumber("");
    setPending(action);
  }

  function closeModal() {
    if (!busy) setPending(null);
  }

  async function submitAction() {
    if (!pending) return;

    const patch: AdminOrderStatusPatch = {
      status: pending.status,
      note: note.trim() || undefined,
    };

    if (pending.status === "cancelled" && cancelReason.trim()) {
      patch.cancelReason = cancelReason.trim();
    }

    if (requiresFulfillment(pending.status)) {
      patch.courierName = courierName.trim();
      patch.trackingNumber = trackingNumber.trim();
    }

    try {
      await statusMutation.mutateAsync(patch);
      toast.success(`Order marked as ${orderStatusLabel(pending.status)}.`);
      setPending(null);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Status update failed";
      toast.error(message);
    }
  }

  if (visibleActions.length === 0) return null;

  const showMobileMenu = !compact && actions.length > 1;

  const buttonBase =
    "admin-btn inline-flex h-9 shrink-0 items-center justify-center rounded-sm px-3.5 text-sm leading-none disabled:opacity-50";

  return (
    <>
      <div
        className={`flex flex-wrap items-start gap-2 ${compact ? "justify-start sm:justify-end" : "mt-4"}`}
      >
        {showMobileMenu ? (
          <div className="relative sm:hidden" ref={menuRef}>
            <button
              type="button"
              disabled={busy}
              onClick={() => setMenuOpen((v) => !v)}
              className={`${buttonBase} border border-lagari-brass text-lagari-brass hover:bg-lagari-brass/10`}
              aria-expanded={menuOpen}
              aria-label="Update order status"
            >
              Update status
              <MoreVertical size={16} className="ml-1.5" aria-hidden />
            </button>
            {menuOpen ? (
              <div className="absolute left-0 z-50 mt-1 min-w-[12rem] overflow-hidden rounded-lg border border-lagari-border bg-lagari-surface py-1 shadow-xl">
                {actions.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    disabled={busy}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-lagari-elevated/60 ${
                      isDestructiveStatus(action.status)
                        ? "text-lagari-danger"
                        : "text-lagari-primary"
                    }`}
                    onClick={() => {
                      setMenuOpen(false);
                      openAction(action);
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={showMobileMenu ? "hidden sm:flex sm:flex-wrap sm:gap-2" : "flex flex-wrap gap-2"}>
          {visibleActions.map((action) => (
            <button
              key={action.status}
              type="button"
              disabled={busy}
              onClick={() => openAction(action)}
              className={
                isDestructiveStatus(action.status)
                  ? `${buttonBase} border border-lagari-danger/50 text-lagari-danger hover:bg-lagari-danger/10`
                  : compact
                    ? `${buttonBase} admin-btn-primary`
                    : `${buttonBase} border border-lagari-brass text-lagari-brass hover:bg-lagari-brass/10`
              }
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 text-left"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-status-modal-title"
        >
          <div className="admin-card w-full max-w-md p-6 text-left">
            <h3 id="order-status-modal-title" className="font-display text-lg font-semibold">
              {pending.label}
            </h3>
            <p className="mt-2 text-sm text-lagari-muted">
              Order will move to{" "}
              <span className="text-lagari-primary">{orderStatusLabel(pending.status)}</span>.
              {restoresInventory(pending.status)
                ? " Inventory for this order will be restored."
                : null}
            </p>

            {requiresFulfillment(pending.status) && (
              <div className="mt-4 space-y-3">
                <label className="block text-sm">
                  <span className="font-medium text-lagari-muted">Courier name</span>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="admin-input mt-1 w-full px-3 py-2"
                    placeholder="e.g. TCS, Leopards"
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-lagari-muted">Tracking number</span>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="admin-input mt-1 w-full px-3 py-2"
                    placeholder="Tracking ID"
                    required
                  />
                </label>
              </div>
            )}

            <label className="mt-4 block text-sm">
              <span className="font-medium text-lagari-muted">
                Internal note (optional)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="admin-input mt-1 w-full px-3 py-2"
                placeholder="Visible on the order timeline — staff only"
              />
            </label>

            {pending.status === "cancelled" && (
              <label className="mt-4 block text-sm">
                <span className="font-medium text-lagari-muted">
                  Message to customer (optional)
                </span>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={2}
                  className="admin-input mt-1 w-full px-3 py-2"
                  placeholder="Included in the cancellation email to the customer"
                />
              </label>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={closeModal}
                className="admin-btn px-4 py-2 text-sm text-lagari-muted hover:text-lagari-primary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  busy ||
                  (requiresFulfillment(pending.status) &&
                    (!courierName.trim() || !trackingNumber.trim()))
                }
                onClick={() => void submitAction()}
                className="admin-btn rounded-sm border border-lagari-brass bg-lagari-brass/10 px-4 py-2 text-sm text-lagari-brass disabled:opacity-50"
              >
                {busy ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

