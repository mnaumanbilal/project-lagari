"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAdminOrders, type AdminOrderRow } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { getValidAccessToken } from "@/lib/admin/token-storage";
import { formatPkr } from "@/lib/format";

const STATUSES = ["", "pending", "confirmed", "shipped", "delivered", "cancelled", "rto"];

export function AdminOrdersList() {
  const { accessToken } = useAdminAuth();
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getValidAccessToken() ?? accessToken;
    if (!token) return;
    setLoading(true);
    fetchAdminOrders(token, status || undefined)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [accessToken, status]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Orders</h1>
      <label className="mt-6 flex items-center gap-3 text-sm font-medium">
        <span className="text-lagari-muted">Filter</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="admin-input px-3 py-2"
        >
          {STATUSES.map((s) => (
            <option key={s || "all"} value={s}>
              {s || "All statuses"}
            </option>
          ))}
        </select>
      </label>

      {loading ? (
        <p className="mt-8 text-lagari-muted">Loading…</p>
      ) : (
        <div className="admin-card mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-lagari-border font-label text-lagari-brass-dim">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-lagari-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin-panel-route/orders/${o.id}`}
                      className="font-medium text-lagari-brass hover:underline"
                    >
                      #{o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {o.customerName}
                    <span className="block text-xs text-lagari-muted">{o.customerPhone}</span>
                  </td>
                  <td className="px-4 py-3 capitalize">{o.status}</td>
                  <td className="px-4 py-3 text-lagari-muted">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">{formatPkr(o.totalPkr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
