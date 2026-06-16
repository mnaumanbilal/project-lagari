"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminBulkActionBar } from "@/components/admin/AdminBulkActionBar";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminRefreshButton } from "@/components/admin/AdminRefreshButton";
import { adminKeys } from "@/lib/admin/admin-query-keys";
import { toastBulkResult } from "@/lib/admin/bulk-result-toast";
import {
  useBulkDeleteAdminProducts,
  useDeleteAdminProduct,
} from "@/lib/admin/hooks/use-admin-mutations";
import { useAdminProducts } from "@/lib/admin/hooks/use-admin-queries";
import { useAdminRowSelection } from "@/lib/admin/hooks/use-admin-row-selection";
import { useAdminToast } from "@/lib/admin/admin-toast-context";
import { AdminProductCard, AdminProductTableRow } from "@/components/admin/AdminProductRow";
import type { AdminProduct } from "@/lib/api/admin";

type PendingDelete =
  | { mode: "single"; product: AdminProduct }
  | { mode: "bulk"; count: number };

export function AdminProductsList() {
  const toast = useAdminToast();
  const { data: products = [], isLoading } = useAdminProducts();
  const deleteProduct = useDeleteAdminProduct();
  const bulkDelete = useBulkDeleteAdminProducts();
  const selection = useAdminRowSelection();
  const [pending, setPending] = useState<PendingDelete | null>(null);

  const ids = products.map((p) => p.id);
  const { allSelected, someSelected } = selection.selectionState(ids);
  const busy = deleteProduct.isPending || bulkDelete.isPending;

  async function confirmDelete() {
    if (!pending) return;
    try {
      if (pending.mode === "single") {
        await deleteProduct.mutateAsync(pending.product.id);
        toast.success(`"${pending.product.title}" removed from the shop.`);
      } else {
        const result = await bulkDelete.mutateAsync(selection.selectedArray);
        toastBulkResult(toast, result, "Products removed");
        selection.clear();
      }
      setPending(null);
    } catch {
      toast.error("Could not delete product(s).");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Products</h1>
        <div className="flex flex-wrap items-center gap-2">
          <AdminRefreshButton queryKey={adminKeys.products()} />
          <Link
            href="/admin-panel-route/products/new"
            className="admin-btn-primary px-4 py-2"
          >
            New product
          </Link>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-6 text-lagari-muted">Loading…</p>
      ) : products.length === 0 ? (
        <p className="mt-6 text-lagari-muted">No products yet.</p>
      ) : (
        <>
          <div className="hidden lg:block admin-card mt-6 overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-lagari-border font-label text-lagari-brass-dim">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all products"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={() => selection.toggleAll(ids)}
                      className="accent-lagari-brass"
                    />
                  </th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Published</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <AdminProductTableRow
                    key={p.id}
                    product={p}
                    selected={selection.isSelected(p.id)}
                    onToggleSelect={() => selection.toggle(p.id)}
                    onDelete={() => setPending({ mode: "single", product: p })}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-6 space-y-3 lg:hidden">
            <li className="flex items-center gap-2 px-1 text-sm">
              <input
                type="checkbox"
                aria-label="Select all products"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={() => selection.toggleAll(ids)}
                className="accent-lagari-brass"
              />
              <span className="text-lagari-muted">Select all</span>
            </li>
            {products.map((p) => (
              <AdminProductCard
                key={p.id}
                product={p}
                selected={selection.isSelected(p.id)}
                onToggleSelect={() => selection.toggle(p.id)}
                onDelete={() => setPending({ mode: "single", product: p })}
              />
            ))}
          </ul>
        </>
      )}

      <AdminBulkActionBar
        selectedCount={selection.selectedCount}
        onClear={selection.clear}
      >
        <button
          type="button"
          disabled={busy}
          className="admin-btn rounded-sm border border-lagari-danger/50 px-3 py-1.5 text-sm text-lagari-danger hover:bg-lagari-danger/10 disabled:opacity-50"
          onClick={() =>
            setPending({ mode: "bulk", count: selection.selectedCount })
          }
        >
          Delete selected
        </button>
      </AdminBulkActionBar>

      <AdminConfirmDialog
        open={pending !== null}
        title={
          pending?.mode === "bulk"
            ? `Delete ${pending.count} product(s)?`
            : `Delete "${pending?.mode === "single" ? pending.product.title : ""}"?`
        }
        description={
          <>
            {pending?.mode === "bulk"
              ? `Remove ${pending.count} product(s) from the shop?`
              : "Remove this product from the shop?"}{" "}
            They will be unpublished and hidden. Order history is kept.
          </>
        }
        confirmLabel="Delete"
        variant="destructive"
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => !busy && setPending(null)}
      />
    </div>
  );
}
