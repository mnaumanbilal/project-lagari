"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ADMIN_ORDERS_PATH } from "@/lib/admin/constants";
import { adminKeys } from "@/lib/admin/admin-query-keys";
import { useAdminOrder } from "@/lib/admin/hooks/use-admin-queries";
import {
  useArchiveAdminOrder,
  usePatchAdminOrderNotes,
} from "@/lib/admin/hooks/use-admin-mutations";
import { useAdminToast } from "@/lib/admin/admin-toast-context";
import { ApiError } from "@/lib/api/client";
import {
  ORDER_WORKFLOW_STEPS,
  orderStatusLabel,
} from "@/lib/admin/order-status";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { AdminOrderCustomerSummary } from "./AdminOrderCustomerSummary";
import { AdminOrderLineItemsTable } from "./AdminOrderLineItemsTable";
import { AdminOrderStatusActions } from "./AdminOrderStatusActions";
import { AdminOrderStatusBadge } from "./AdminOrderStatusBadge";
import { AdminRefreshButton } from "./AdminRefreshButton";

export function AdminOrderDetailView() {
  const { id } = useParams<{ id: string }>();
  const toast = useAdminToast();
  const { data: order, isLoading, error } = useAdminOrder(id);
  const notesMutation = usePatchAdminOrderNotes(id ?? "");
  const archiveMutation = useArchiveAdminOrder(id ?? "");
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const effectiveNotes = notesDraft ?? order?.adminNotes ?? "";
  const isArchived = Boolean(order?.archivedAt);

  async function saveNotes() {
    try {
      await notesMutation.mutateAsync(effectiveNotes.trim() || null);
      setNotesDraft(null);
      toast.success("Internal notes saved.");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not save notes.";
      toast.error(message);
    }
  }

  function copyTracking() {
    if (!order?.trackingNumber) return;
    void navigator.clipboard.writeText(order.trackingNumber);
    toast.info("Tracking number copied.");
  }

  async function handleArchiveToggle() {
    try {
      await archiveMutation.mutateAsync(!isArchived);
      toast.success(isArchived ? "Order restored." : "Order archived.");
      setConfirmArchive(false);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not update order.";
      toast.error(message);
    }
  }

  if (isLoading) {
    return <p className="text-lagari-muted">Loading…</p>;
  }

  if (!order) {
    return (
      <p className="text-lagari-muted">
        {error instanceof Error ? error.message : "Order not found"}
      </p>
    );
  }

  const workflowIndex = ORDER_WORKFLOW_STEPS.indexOf(
    order.status as (typeof ORDER_WORKFLOW_STEPS)[number],
  );
  const isTerminal = ["cancelled", "rto"].includes(order.status);

  return (
    <div className="mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={ADMIN_ORDERS_PATH}
          className="text-sm font-medium text-lagari-brass hover:underline"
        >
          ← Back to orders
        </Link>
        <AdminRefreshButton queryKey={adminKeys.order(order.id)} />
        <button
          type="button"
          disabled={archiveMutation.isPending}
          onClick={() => setConfirmArchive(true)}
          className={`admin-btn rounded-sm border px-3 py-2 text-sm disabled:opacity-50 ${
            isArchived
              ? "border-lagari-brass text-lagari-brass hover:bg-lagari-brass/10"
              : "border-lagari-muted text-lagari-muted hover:border-lagari-danger hover:text-lagari-danger"
          }`}
        >
          {isArchived ? "Restore order" : "Archive order"}
        </button>
      </div>

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
            {isArchived ? " · Archived" : ""}
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

      {order.status === "cancelled" && order.cancelReason && (
        <section className="admin-card mt-6 p-5 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-lagari-brass-dim">
            Customer cancellation message
          </h2>
          <p className="mt-3 text-sm text-lagari-primary">{order.cancelReason}</p>
          <p className="mt-2 text-xs text-lagari-muted">
            Sent to the customer by email when the order was cancelled.
          </p>
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
          value={effectiveNotes}
          onChange={(e) => setNotesDraft(e.target.value)}
          rows={3}
          className="admin-input mt-3 w-full px-3 py-2.5 text-sm"
          placeholder="Ops notes visible only to admins"
        />
        <button
          type="button"
          disabled={notesMutation.isPending}
          onClick={() => void saveNotes()}
          className="admin-btn mt-3 inline-flex h-9 items-center rounded-sm border border-lagari-brass px-4 text-sm text-lagari-brass hover:bg-lagari-brass/10 disabled:opacity-50"
        >
          {notesMutation.isPending ? "Saving…" : "Save notes"}
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

      <AdminConfirmDialog
        open={confirmArchive}
        title={isArchived ? "Restore this order?" : "Archive this order?"}
        description={
          isArchived
            ? "This order will appear in the active orders list again."
            : "Hide this order from the default list. Status history and customer records are kept."
        }
        confirmLabel={isArchived ? "Restore" : "Archive"}
        variant={isArchived ? "default" : "destructive"}
        busy={archiveMutation.isPending}
        onConfirm={() => void handleArchiveToggle()}
        onCancel={() => !archiveMutation.isPending && setConfirmArchive(false)}
      />
    </div>
  );
}
