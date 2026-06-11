"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminOrderCard, AdminOrderTableRows } from "./AdminOrderRow";
import { AdminBulkActionBar } from "@/components/admin/AdminBulkActionBar";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminPageToolbar } from "@/components/admin/AdminRefreshButton";
import { adminKeys } from "@/lib/admin/admin-query-keys";
import { toastBulkResult } from "@/lib/admin/bulk-result-toast";
import { useBulkArchiveAdminOrders } from "@/lib/admin/hooks/use-admin-mutations";
import { useAdminOrders } from "@/lib/admin/hooks/use-admin-queries";
import { useAdminRowSelection } from "@/lib/admin/hooks/use-admin-row-selection";
import { useAdminToast } from "@/lib/admin/admin-toast-context";
import { ApiError } from "@/lib/api/client";

const STATUSES = [
  "",
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "rto",
];

const PAGE_SIZE = 25;

type ArchivedFilter = "false" | "true" | "all";

export function AdminOrdersList() {
  const toast = useAdminToast();
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [archived, setArchived] = useState<ArchivedFilter>("false");
  const [confirmArchive, setConfirmArchive] = useState(false);

  const selection = useAdminRowSelection();
  const bulkArchive = useBulkArchiveAdminOrders();

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [status, search, archived]);

  const queryParams = useMemo(
    () => ({
      status: status || undefined,
      search: search || undefined,
      page,
      limit: PAGE_SIZE,
      archived,
    }),
    [status, search, page, archived],
  );

  const { data, isLoading, error } = useAdminOrders(queryParams);

  useEffect(() => {
    if (error) {
      const message =
        error instanceof ApiError ? error.message : "Could not load orders.";
      toast.error(message);
    }
  }, [error, toast]);

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const ids = orders.map((o) => o.id);
  const { allSelected, someSelected } = selection.selectionState(ids);
  const busy = bulkArchive.isPending;

  async function confirmBulkArchive() {
    try {
      const result = await bulkArchive.mutateAsync({
        ids: selection.selectedArray,
        archived: archived !== "true",
      });
      toastBulkResult(
        toast,
        result,
        archived === "true" ? "Orders restored" : "Orders archived",
      );
      selection.clear();
      setConfirmArchive(false);
    } catch {
      toast.error("Could not update orders.");
    }
  }

  return (
    <div>
      <AdminPageToolbar
        title="Orders"
        description="Manage COD orders, line items, and fulfillment status."
        queryKey={adminKeys.orders(queryParams)}
      />

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
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
        <div className="flex gap-2">
          {(
            [
              { id: "false", label: "Active" },
              { id: "true", label: "Archived" },
              { id: "all", label: "All" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setArchived(f.id)}
              className={`admin-btn rounded-sm px-3 py-2 text-sm ${
                archived === f.id
                  ? "admin-btn-primary"
                  : "admin-card border border-lagari-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-8 text-lagari-muted">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="mt-8 text-lagari-muted">
          {search || status || archived !== "false"
            ? "No orders match your filters."
            : "No orders yet."}
        </p>
      ) : (
        <>
          <p className="mt-4 text-xs text-lagari-muted">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {(page - 1) * PAGE_SIZE + orders.length} of {total} orders
          </p>
          <div className="hidden lg:block admin-card mt-2 overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead className="border-b border-lagari-border font-label text-lagari-brass-dim">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all orders"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={() => selection.toggleAll(ids)}
                      className="accent-lagari-brass"
                    />
                  </th>
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
                  <AdminOrderTableRows
                    key={order.id}
                    order={order}
                    selectable
                    selected={selection.isSelected(order.id)}
                    onToggleSelect={() => selection.toggle(order.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-2 space-y-2 lg:hidden">
            <li className="flex items-center gap-2 px-0.5 pb-0.5 text-sm">
              <input
                type="checkbox"
                aria-label="Select all orders"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={() => selection.toggleAll(ids)}
                className="accent-lagari-brass"
              />
              <span className="text-lagari-muted">Select all on this page</span>
            </li>
            {orders.map((order) => (
              <AdminOrderCard
                key={order.id}
                order={order}
                selectable
                selected={selection.isSelected(order.id)}
                onToggleSelect={() => selection.toggle(order.id)}
              />
            ))}
          </ul>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="admin-btn px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-lagari-muted">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="admin-btn px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}

      <AdminBulkActionBar
        selectedCount={selection.selectedCount}
        onClear={selection.clear}
      >
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirmArchive(true)}
          className="admin-btn rounded-sm border border-lagari-brass px-3 py-1.5 text-sm text-lagari-brass hover:bg-lagari-brass/10 disabled:opacity-50"
        >
          {archived === "true" ? "Restore selected" : "Archive selected"}
        </button>
      </AdminBulkActionBar>

      <AdminConfirmDialog
        open={confirmArchive}
        title={
          archived === "true"
            ? `Restore ${selection.selectedCount} order(s)?`
            : `Archive ${selection.selectedCount} order(s)?`
        }
        description={
          archived === "true"
            ? "Restored orders appear in the active list again."
            : "Archived orders are hidden from the default list. Customer records and status history are kept."
        }
        confirmLabel={archived === "true" ? "Restore" : "Archive"}
        variant={archived === "true" ? "default" : "destructive"}
        busy={busy}
        onConfirm={() => void confirmBulkArchive()}
        onCancel={() => !busy && setConfirmArchive(false)}
      />
    </div>
  );
}
