"use client";

import { useState } from "react";
import {
  fetchAdminOrder,
  patchAdminOrderStatus,
  type AdminOrderDetail,
  type AdminOrderStatusPatch,
} from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { getValidAccessToken } from "@/lib/admin/token-storage";
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
  onSuccess?: (detail: AdminOrderDetail) => void;
};

export function AdminOrderStatusActions({
  orderId,
  status,
  allowedNextStatuses,
  compact = false,
  onSuccess,
}: Props) {
  const { accessToken } = useAdminAuth();
  const toast = useAdminToast();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [note, setNote] = useState("");
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

  function openAction(action: PendingAction) {
    setNote("");
    setCourierName("");
    setTrackingNumber("");
    setPending(action);
  }

  function closeModal() {
    if (!busy) setPending(null);
  }

  async function submitAction() {
    const token = getValidAccessToken() ?? accessToken;
    if (!token || !pending) return;

    const patch: AdminOrderStatusPatch = {
      status: pending.status,
      note: note.trim() || undefined,
    };

    if (requiresFulfillment(pending.status)) {
      patch.courierName = courierName.trim();
      patch.trackingNumber = trackingNumber.trim();
    }

    setBusy(true);
    try {
      const detail = await patchAdminOrderStatus(token, orderId, patch);
      toast.success(`Order marked as ${orderStatusLabel(pending.status)}.`);
      setPending(null);
      onSuccess?.(detail);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Status update failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (visibleActions.length === 0) return null;

  const buttonBase =
    "admin-btn inline-flex h-9 shrink-0 items-center justify-center rounded-sm px-3.5 text-sm leading-none disabled:opacity-50";

  return (
    <>
      <div
        className={`flex flex-wrap items-start gap-2 ${compact ? "justify-start sm:justify-end" : "mt-4"}`}
      >
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

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-status-modal-title"
        >
          <div className="admin-card w-full max-w-md p-6">
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
              <span className="font-medium text-lagari-muted">Note (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="admin-input mt-1 w-full px-3 py-2"
                placeholder="Add a note for the timeline"
              />
            </label>

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

/** Lazy-load full order detail for accordion expansion. */
export async function loadOrderDetail(
  accessToken: string,
  orderId: string,
): Promise<AdminOrderDetail> {
  return fetchAdminOrder(accessToken, orderId);
}
