"use client";

import { useEffect, useState } from "react";
import { fetchAdminOrders, type AdminOrderRow } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { getValidAccessToken } from "@/lib/admin/token-storage";
import { useAdminToast } from "@/lib/admin/admin-toast-context";
import { ApiError } from "@/lib/api/client";
import { AdminOrderRow as AdminOrderRowComponent } from "./AdminOrderRow";

const STATUSES = ["", "pending", "confirmed", "shipped", "delivered", "cancelled", "rto"];

export function AdminOrdersList() {
  const { accessToken } = useAdminAuth();
  const toast = useAdminToast();
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const token = getValidAccessToken() ?? accessToken;
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchAdminOrders(token, {
      status: status || undefined,
      search: search || undefined,
    })
      .then((result) => {
        setOrders(result.orders);
        setTotal(result.total);
      })
      .catch((err: unknown) => {
        setOrders([]);
        setTotal(0);
        const message =
          err instanceof ApiError ? err.message : "Could not load orders.";
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [accessToken, status, search]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Orders</h1>
      <p className="mt-2 text-sm text-lagari-muted">
        Manage COD orders, line items, and fulfillment status.
      </p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
          <span className="text-lagari-muted">Search</span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Order #, phone, or customer name"
            className="admin-input px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          <span className="text-lagari-muted">Status</span>
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
      </div>

      {loading ? (
        <p className="mt-8 text-lagari-muted">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="mt-8 text-lagari-muted">
          {search || status ? "No orders match your filters." : "No orders yet."}
        </p>
      ) : (
        <>
          <p className="mt-4 text-xs text-lagari-muted">
            Showing {orders.length} of {total} orders
          </p>
          <div className="admin-card mt-2 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-lagari-border font-label text-lagari-brass-dim">
                <tr>
                  <th className="w-10 px-3 py-3" aria-label="Expand" />
                  <th className="px-3 py-3">Order</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <AdminOrderRowComponent key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
