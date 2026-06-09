"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchAdminOrder,
  patchAdminOrderStatus,
  type AdminOrderDetail,
} from "@/lib/api/admin";
import { ADMIN_ORDERS_PATH } from "@/lib/admin/constants";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { getValidAccessToken } from "@/lib/admin/token-storage";
import { formatPkr } from "@/lib/format";
import { useAdminToast } from "@/lib/admin/admin-toast-context";
import { ApiError } from "@/lib/api/client";

const NEXT_STATUS: Record<string, Array<{ status: string; label: string }>> = {
  pending: [
    { status: "confirmed", label: "Confirm" },
    { status: "cancelled", label: "Cancel" },
    { status: "rto", label: "Mark RTO" },
  ],
  confirmed: [
    { status: "shipped", label: "Mark shipped" },
    { status: "cancelled", label: "Cancel" },
    { status: "rto", label: "Mark RTO" },
  ],
  shipped: [
    { status: "delivered", label: "Mark delivered" },
    { status: "rto", label: "Mark RTO" },
  ],
};

export function AdminOrderDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAdminAuth();
  const toast = useAdminToast();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getValidAccessToken() ?? accessToken;
    if (!token || !id) return;
    fetchAdminOrder(token, id).then(setOrder).catch(() => setError("Order not found"));
  }, [accessToken, id]);

  async function changeStatus(status: string) {
    const token = getValidAccessToken() ?? accessToken;
    if (!token || !id) return;
    setBusy(true);
    setError(null);
    try {
      await patchAdminOrderStatus(token, id, status);
      const refreshed = await fetchAdminOrder(token, id);
      setOrder(refreshed);
      toast.success(`Order marked as ${status}.`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Status update failed";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (!order) {
    return <p className="text-lagari-muted">{error ?? "Loading…"}</p>;
  }

  const actions = NEXT_STATUS[order.status] ?? [];

  return (
    <div>
      <Link href={ADMIN_ORDERS_PATH} className="text-sm font-medium text-lagari-brass hover:underline">
        ← Orders
      </Link>
      <h1 className="font-display mt-4 text-3xl font-semibold">Order #{order.orderNumber}</h1>
      <p className="mt-1 capitalize text-lagari-muted">Status: {order.status}</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {actions.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {actions.map((a) => (
            <button
              key={a.status}
              type="button"
              disabled={busy}
              onClick={() => changeStatus(a.status)}
              className="admin-btn rounded-sm border border-lagari-brass px-4 py-2 text-lagari-brass hover:bg-lagari-brass/10 disabled:opacity-50"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="admin-card p-5">
          <h2 className="text-sm font-semibold text-lagari-brass-dim">Customer</h2>
          <p className="mt-2">{order.customerName ?? "—"}</p>
          <p className="text-sm text-lagari-muted">{order.customerPhone}</p>
          <p className="mt-4 text-sm">
            {order.shippingCity}
            <br />
            {order.shippingAddress}
          </p>
        </div>
        <div className="admin-card p-5">
          <h2 className="text-sm font-semibold text-lagari-brass-dim">Totals</h2>
          <p className="mt-2 font-display text-2xl">{formatPkr(order.totalPkr)}</p>
          <p className="text-sm text-lagari-muted">Subtotal {formatPkr(order.subtotalPkr)}</p>
        </div>
      </section>

      <section className="admin-card mt-8 p-5">
        <h2 className="font-display text-lg font-semibold">Line items</h2>
        <ul className="mt-4 space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span>
                {item.productTitleSnapshot} — {item.variantNameSnapshot} × {item.quantity}
              </span>
              <span>{formatPkr(item.unitPricePkr * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-card mt-8 p-5">
        <h2 className="font-display text-lg font-semibold">Timeline</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {order.timeline.map((t, i) => (
            <li key={i} className="text-lagari-muted">
              <span className="text-lagari-primary">{t.message}</span>
              <span className="ml-2 text-xs">
                {new Date(t.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        className="mt-8 text-sm font-medium text-lagari-muted hover:text-lagari-brass"
        onClick={() => router.refresh()}
      >
        Refresh
      </button>
    </div>
  );
}
