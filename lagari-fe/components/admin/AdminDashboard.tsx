"use client";

import Link from "next/link";
import { AdminOrderCard, AdminOrderTableRows } from "@/components/admin/AdminOrderRow";
import { AdminPageToolbar } from "@/components/admin/AdminRefreshButton";
import {
  ADMIN_ANALYTICS_PATH,
  ADMIN_ORDERS_PATH,
  ADMIN_PRODUCTS_PATH,
  ADMIN_REVIEWS_PATH,
} from "@/lib/admin/constants";
import { adminKeys } from "@/lib/admin/admin-query-keys";
import { useAdminMetrics, useAdminOrders } from "@/lib/admin/hooks/use-admin-queries";
import { formatPkr } from "@/lib/format";

const recentOrdersParams = { limit: 10 };

export function AdminDashboard() {
  const metricsQuery = useAdminMetrics();
  const ordersQuery = useAdminOrders(recentOrdersParams);

  const metrics = metricsQuery.data;
  const orders = ordersQuery.data?.orders ?? [];
  const loadError =
    metricsQuery.error || ordersQuery.error
      ? "Could not load admin data."
      : null;

  return (
    <div>
      <AdminPageToolbar
        title="Dashboard"
        description="Overview and quick links to operations."
        queryKey={[adminKeys.metrics(), adminKeys.orders(recentOrdersParams)]}
      />

      {loadError && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {loadError}
        </p>
      )}

      {metrics && (
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Orders today" value={String(metrics.ordersToday)} />
          <MetricCard
            label="Revenue today"
            value={formatPkr(metrics.revenueTodayPkr)}
          />
          <MetricCard
            label="Pending orders"
            value={String(metrics.pendingOrders)}
            href={ADMIN_ORDERS_PATH}
          />
          <MetricCard
            label="Low stock SKUs"
            value={String(metrics.lowStockCount)}
            href={ADMIN_PRODUCTS_PATH}
          />
          <MetricCard
            label="Pending reviews"
            value={String(metrics.pendingReviews ?? 0)}
            href={`${ADMIN_REVIEWS_PATH}?status=pending`}
          />
          <MetricCard
            label="Active sessions"
            value={String(metrics.activeSessions)}
            href={ADMIN_ANALYTICS_PATH}
          />
        </dl>
      )}

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent orders</h2>
          <Link
            href={ADMIN_ORDERS_PATH}
            className="text-sm font-medium text-lagari-brass hover:underline"
          >
            View all
          </Link>
        </div>
        {ordersQuery.isLoading ? (
          <p className="mt-4 text-lagari-muted">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="mt-4 text-lagari-muted">No orders yet.</p>
        ) : (
          <>
            <div className="hidden lg:block admin-card mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-lagari-border font-label text-lagari-brass-dim">
                  <tr>
                    <th className="w-10 px-4 py-3" aria-label="Expand" />
                    <th className="px-4 py-3">Order</th>
                    <th className="min-w-[10rem] px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <AdminOrderTableRows
                      key={order.id}
                      order={order}
                      variant="dashboard"
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-4 space-y-3 lg:hidden">
              {orders.map((order) => (
                <AdminOrderCard
                  key={order.id}
                  order={order}
                  variant="dashboard"
                />
              ))}
            </ul>
          </>
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
