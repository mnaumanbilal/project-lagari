"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchAdminOrder,
  patchAdminOrderNotes,
  type AdminOrderDetail,
} from "@/lib/api/admin";
import { ADMIN_ORDERS_PATH } from "@/lib/admin/constants";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { getValidAccessToken } from "@/lib/admin/token-storage";
import { useAdminToast } from "@/lib/admin/admin-toast-context";
import { ApiError } from "@/lib/api/client";
import {
  ORDER_WORKFLOW_STEPS,
  orderStatusLabel,
} from "@/lib/admin/order-status";
import { AdminOrderCustomerSummary } from "./AdminOrderCustomerSummary";
import { AdminOrderLineItemsTable } from "./AdminOrderLineItemsTable";
import { AdminOrderStatusActions } from "./AdminOrderStatusActions";
import { AdminOrderStatusBadge } from "./AdminOrderStatusBadge";

export function AdminOrderDetailView() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAdminAuth();
  const toast = useAdminToast();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    const token = getValidAccessToken() ?? accessToken;
    if (!token || !id) return;
    fetchAdminOrder(token, id)
      .then((detail) => {
        setOrder(detail);
        setNotesDraft(detail.adminNotes ?? "");
        setError(null);
      })
      .catch(() => setError("Order not found"));
  }, [accessToken, id]);

  async function saveNotes() {
    const token = getValidAccessToken() ?? accessToken;
    if (!token || !id) return;
    setSavingNotes(true);
    try {
      const updated = await patchAdminOrderNotes(
        token,
        id,
        notesDraft.trim() || null,
      );
      setOrder(updated);
      toast.success("Internal notes saved.");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not save notes.";
      toast.error(message);
    } finally {
      setSavingNotes(false);
    }
  }

  function copyTracking() {
    if (!order?.trackingNumber) return;
    void navigator.clipboard.writeText(order.trackingNumber);
    toast.info("Tracking number copied.");
  }

  if (!order) {
    return <p className="text-lagari-muted">{error ?? "Loading…"}</p>;
  }

  const workflowIndex = ORDER_WORKFLOW_STEPS.indexOf(
    order.status as (typeof ORDER_WORKFLOW_STEPS)[number],
  );
  const isTerminal = ["cancelled", "rto"].includes(order.status);

  return (
    <div className="mx-auto">
      <Link
        href={ADMIN_ORDERS_PATH}
        className="text-sm font-medium text-lagari-brass hover:underline"
      >
        ← Back to orders
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-lagari-border/60 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-lagari-brass-dim">
            Order
          </p>
          <h1 className="font-display mt-1 text-3xl font-semibold">
            #{order.orderNumber}
          </h1>
          <p className="mt-1.5 text-sm text-lagari-muted">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <AdminOrderStatusBadge status={order.status} />
      </header>

      {!isTerminal && (
        <section className="admin-card mt-8 p-5 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-lagari-brass-dim">
            Fulfillment workflow
          </h2>
          <ol className="mt-4 flex flex-wrap items-center gap-2">
            {ORDER_WORKFLOW_STEPS.map((step, index) => {
              const active = workflowIndex === index;
              const complete = workflowIndex > index;
              return (
                <li key={step} className="flex items-center text-sm">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      active
                        ? "border-lagari-brass bg-lagari-brass/15 text-lagari-brass"
                        : complete
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-lagari-border text-lagari-muted"
                    }`}
                  >
                    {orderStatusLabel(step)}
                  </span>
                  {index < ORDER_WORKFLOW_STEPS.length - 1 && (
                    <span className="mx-2 text-lagari-muted" aria-hidden>
                      →
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          <AdminOrderStatusActions
            orderId={order.id}
            status={order.status}
            allowedNextStatuses={order.allowedNextStatuses}
            onSuccess={setOrder}
          />
        </section>
      )}

      {(order.courierName || order.trackingNumber) && (
        <section className="admin-card mt-6 p-5 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-lagari-brass-dim">
            Shipment
          </h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-lagari-muted">Courier</dt>
              <dd className="mt-0.5 font-medium">{order.courierName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-lagari-muted">Tracking number</dt>
              <dd className="mt-0.5 flex items-center gap-2 font-medium">
                {order.trackingNumber ?? "—"}
                {order.trackingNumber && (
                  <button
                    type="button"
                    onClick={copyTracking}
                    className="text-xs font-medium text-lagari-brass hover:underline"
                  >
                    Copy
                  </button>
                )}
              </dd>
            </div>
          </dl>
        </section>
      )}

      <section className="admin-card mt-8 p-5 sm:p-6">
        <AdminOrderCustomerSummary
          name={order.customerName}
          phone={order.customerPhone}
          email={order.customerEmail}
          city={order.shippingCity}
          address={order.shippingAddress}
        />
      </section>

      <section className="admin-card mt-6 p-5 sm:p-6">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-lagari-brass-dim">
            Line items
          </h2>
          <span className="text-xs text-lagari-muted">
            {order.itemCount} piece{order.itemCount === 1 ? "" : "s"}
          </span>
        </div>
        <AdminOrderLineItemsTable
          items={order.items}
          subtotalPkr={order.subtotalPkr}
          discountPkr={order.discountPkr}
          totalPkr={order.totalPkr}
        />
      </section>

      <section className="admin-card mt-6 p-5 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-lagari-brass-dim">
          Internal notes
        </h2>
        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          rows={3}
          className="admin-input mt-3 w-full px-3 py-2.5 text-sm"
          placeholder="Ops notes visible only to admins"
        />
        <button
          type="button"
          disabled={savingNotes}
          onClick={() => void saveNotes()}
          className="admin-btn mt-3 inline-flex h-9 items-center rounded-sm border border-lagari-brass px-4 text-sm text-lagari-brass hover:bg-lagari-brass/10 disabled:opacity-50"
        >
          {savingNotes ? "Saving…" : "Save notes"}
        </button>
      </section>

      <section className="admin-card mt-6 p-5 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-lagari-brass-dim">
          Timeline
        </h2>
        <ul className="mt-4 space-y-0">
          {order.timeline.map((event, index) => (
            <li
              key={`${event.createdAt}-${index}`}
              className="relative border-l border-lagari-border py-3 pl-5 last:pb-0"
            >
              <span
                className="absolute -left-[5px] top-[1.125rem] h-2 w-2 rounded-full bg-lagari-brass/80"
                aria-hidden
              />
              <p className="text-sm text-lagari-primary">{event.message}</p>
              <p className="mt-1 text-xs text-lagari-muted">
                {new Date(event.createdAt).toLocaleString()}
                {event.fromStatus && event.toStatus ? (
                  <span className="ml-2 text-lagari-brass-dim">
                    {orderStatusLabel(event.fromStatus)} →{" "}
                    {orderStatusLabel(event.toStatus)}
                  </span>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
