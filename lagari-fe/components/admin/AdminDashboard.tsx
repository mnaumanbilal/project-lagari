"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchAdminMetrics,
  fetchAdminOrders,
  type AdminMetrics,
  type AdminOrderRow,
} from "@/lib/api/admin";
import {
  ADMIN_ANALYTICS_PATH,
  ADMIN_ORDERS_PATH,
  ADMIN_PRODUCTS_PATH,
} from "@/lib/admin/constants";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { getValidAccessToken } from "@/lib/admin/token-storage";
import { ApiError } from "@/lib/api/client";
import { formatPkr } from "@/lib/format";

export function AdminDashboard() {
  const { accessToken, logout } = useAdminAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const token = getValidAccessToken() ?? accessToken;
    if (!token) return;
    const authToken = token;

    let cancelled = false;

    async function load() {
      try {
        const [m, o] = await Promise.all([
          fetchAdminMetrics(authToken),
          fetchAdminOrders(authToken),
        ]);
        if (!cancelled) {
          setMetrics(m);
          setOrders(o.slice(0, 10));
          setLoadError(null);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) logout();
          setLoadError("Could not load admin data.");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, logout]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-lagari-muted">
        Overview and quick links to operations.
      </p>

      {loadError && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {loadError}
        </p>
      )}

      {metrics && (
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Orders today" value={String(metrics.ordersToday)} />
          <MetricCard label="Revenue today" value={formatPkr(metrics.revenueTodayPkr)} />
          <MetricCard label="Pending orders" value={String(metrics.pendingOrders)} href={ADMIN_ORDERS_PATH} />
          <MetricCard label="Low stock SKUs" value={String(metrics.lowStockCount)} href={ADMIN_PRODUCTS_PATH} />
          <MetricCard label="Active sessions" value={String(metrics.activeSessions)} href={ADMIN_ANALYTICS_PATH} />
        </dl>
      )}

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent orders</h2>
          <Link href={ADMIN_ORDERS_PATH} className="text-sm font-medium text-lagari-brass hover:underline">
            View all
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="mt-4 text-lagari-muted">No orders yet.</p>
        ) : (
          <div className="admin-card mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-lagari-border font-label text-lagari-brass-dim">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-lagari-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin-panel-route/orders/${o.id}`} className="text-lagari-brass hover:underline">
                        #{o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-lagari-muted">
                      {o.customerName}
                      <span className="block text-xs">{o.customerPhone}</span>
                    </td>
                    <td className="px-4 py-3 capitalize">{o.status}</td>
                    <td className="px-4 py-3 text-right">{formatPkr(o.totalPkr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="admin-card px-4 py-5">
      <dt className="font-label text-lagari-brass-dim">{label}</dt>
      <dd className="font-display mt-2 text-2xl font-semibold">{value}</dd>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
