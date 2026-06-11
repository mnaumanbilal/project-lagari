"use client";

import { useState } from "react";
import { StarRating } from "@/components/storefront/StarRating";
import { AdminBulkActionBar } from "@/components/admin/AdminBulkActionBar";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminPageToolbar } from "@/components/admin/AdminRefreshButton";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { adminKeys } from "@/lib/admin/admin-query-keys";
import { toastBulkResult } from "@/lib/admin/bulk-result-toast";
import { useAdminReviews } from "@/lib/admin/hooks/use-admin-queries";
import {
  useBulkDeleteAdminReviews,
  useBulkPatchAdminReviews,
  useDeleteAdminReview,
  useImportShopifyReviews,
  usePatchAdminReview,
} from "@/lib/admin/hooks/use-admin-mutations";
import { useAdminRowSelection } from "@/lib/admin/hooks/use-admin-row-selection";
import { useAdminToast } from "@/lib/admin/admin-toast-context";
import type { AdminReview } from "@/lib/api/admin";

type PendingDelete = { mode: "single"; review: AdminReview } | { mode: "bulk" };

export function AdminReviews() {
  const toast = useAdminToast();
  const [tab, setTab] = useState<"pending" | "published">("pending");
  const { data: reviews = [], isLoading } = useAdminReviews(tab);
  const patchReview = usePatchAdminReview();
  const deleteReview = useDeleteAdminReview();
  const bulkDelete = useBulkDeleteAdminReviews();
  const bulkPatch = useBulkPatchAdminReviews();
  const importReviews = useImportShopifyReviews();
  const selection = useAdminRowSelection();
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const ids = reviews.map((r) => r.id);
  const { allSelected, someSelected } = selection.selectionState(ids);
  const busy =
    deleteReview.isPending || bulkDelete.isPending || bulkPatch.isPending;

  async function handleImport(file: File) {
    const text = await file.text();
    let rows: Array<Record<string, unknown>> = [];
    try {
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text) as { reviews?: unknown[] } | unknown[];
        rows = Array.isArray(parsed)
          ? (parsed as Array<Record<string, unknown>>)
          : ((parsed as { reviews?: unknown[] }).reviews ?? []) as Array<
              Record<string, unknown>
            >;
      } else {
        const lines = text.trim().split(/\r?\n/);
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        rows = lines.slice(1).map((line) => {
          const cols = line.split(",");
          const row: Record<string, unknown> = {};
          headers.forEach((h, i) => {
            row[h] = cols[i]?.trim();
          });
          return {
            productSlug: row.product_slug ?? row.handle ?? row.producthandle,
            author: row.author ?? row.author_name,
            rating: Number(row.rating),
            body: row.body ?? row.review,
            legacyId: row.legacy_id ?? row.id,
          };
        });
      }
      const result = await importReviews.mutateAsync({
        reviews: rows,
        publishByDefault: true,
      });
      setImportMsg(`Imported ${result.imported}, skipped ${result.skipped}`);
      toast.success(`Imported ${result.imported} review(s).`);
    } catch {
      setImportMsg("Import failed — use CSV or JSON export format.");
      toast.error("Import failed — check file format.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.mode === "single") {
        await deleteReview.mutateAsync(pendingDelete.review.id);
        toast.success("Review deleted.");
      } else {
        const result = await bulkDelete.mutateAsync(selection.selectedArray);
        toastBulkResult(toast, result, "Reviews deleted");
        selection.clear();
      }
      setPendingDelete(null);
    } catch {
      toast.error("Could not delete review(s).");
    }
  }

  async function bulkPublish(isPublished: boolean) {
    try {
      const result = await bulkPatch.mutateAsync({
        ids: selection.selectedArray,
        isPublished,
      });
      toastBulkResult(
        toast,
        result,
        isPublished ? "Reviews published" : "Reviews unpublished",
      );
      selection.clear();
    } catch {
      toast.error("Could not update reviews.");
    }
  }

  return (
    <div>
      <AdminPageToolbar
        title="Reviews"
        description="Customer reviews are held for moderation unless the buyer has a verified order for that product. Publish or delete from the queues below."
        queryKey={adminKeys.reviews(tab)}
      />

      <div className="admin-card mt-6 p-4">
        <h2 className="text-sm font-semibold text-lagari-muted">Shopify import</h2>
        <input
          type="file"
          accept=".csv,.json"
          className="mt-2 block text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImport(f);
          }}
        />
        {importMsg && <p className="mt-2 text-sm text-lagari-muted">{importMsg}</p>}
      </div>

      <div className="mt-8 flex gap-2">
        {(["pending", "published"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              selection.clear();
            }}
            className={`admin-btn rounded-sm px-4 py-2 capitalize ${
              tab === t
                ? "admin-btn-primary"
                : "admin-card border border-lagari-border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="mt-6 text-lagari-muted">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="mt-6 text-lagari-muted">No reviews in this queue.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          <li className="flex items-center gap-3 px-1 text-sm text-lagari-muted">
            <input
              type="checkbox"
              aria-label="Select all reviews"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={() => selection.toggleAll(ids)}
              className="accent-lagari-brass"
            />
            Select all on this page
          </li>
          {reviews.map((r) => (
            <li key={r.id} className="admin-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    aria-label={`Select review by ${r.authorName}`}
                    checked={selection.isSelected(r.id)}
                    onChange={() => selection.toggle(r.id)}
                    className="mt-1 accent-lagari-brass"
                  />
                  <div>
                    <p className="font-medium">
                      {r.productTitle}{" "}
                      <span className="text-sm text-lagari-muted">
                        ({r.productSlug})
                      </span>
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                      <StarRating value={r.rating} readonly size="sm" />
                      <span>{r.authorName}</span>
                      <span className="text-lagari-muted">· {r.source}</span>
                      {r.isVerifiedPurchase && (
                        <span className="text-xs text-lagari-brass">
                          Verified purchase
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <AdminRowActionsMenu
                  menuLabel={`Actions for review by ${r.authorName}`}
                  actions={[
                    ...(tab === "pending"
                      ? [
                          {
                            label: "Publish",
                            onClick: () =>
                              void patchReview.mutateAsync({
                                id: r.id,
                                isPublished: true,
                              }),
                            disabled: patchReview.isPending,
                          },
                        ]
                      : [
                          {
                            label: "Unpublish",
                            onClick: () =>
                              void patchReview.mutateAsync({
                                id: r.id,
                                isPublished: false,
                              }),
                            disabled: patchReview.isPending,
                          },
                        ]),
                    {
                      label: "Delete",
                      onClick: () =>
                        setPendingDelete({ mode: "single", review: r }),
                      variant: "destructive" as const,
                    },
                  ]}
                />
              </div>
              <p className="mt-3 pl-7 text-sm text-lagari-muted">{r.body}</p>
            </li>
          ))}
        </ul>
      )}

      <AdminBulkActionBar
        selectedCount={selection.selectedCount}
        onClear={selection.clear}
      >
        {tab === "pending" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void bulkPublish(true)}
            className="admin-btn rounded-sm border border-lagari-brass px-3 py-1.5 text-sm text-lagari-brass hover:bg-lagari-brass/10 disabled:opacity-50"
          >
            Publish selected
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void bulkPublish(false)}
            className="admin-btn rounded-sm border border-lagari-border px-3 py-1.5 text-sm text-lagari-muted hover:text-lagari-primary disabled:opacity-50"
          >
            Unpublish selected
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => setPendingDelete({ mode: "bulk" })}
          className="admin-btn rounded-sm border border-lagari-danger/50 px-3 py-1.5 text-sm text-lagari-danger hover:bg-lagari-danger/10 disabled:opacity-50"
        >
          Delete selected
        </button>
      </AdminBulkActionBar>

      <AdminConfirmDialog
        open={pendingDelete !== null}
        title={
          pendingDelete?.mode === "bulk"
            ? `Delete ${selection.selectedCount} review(s)?`
            : "Delete this review?"
        }
        description="This permanently removes the review. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => !busy && setPendingDelete(null)}
      />
    </div>
  );
}
