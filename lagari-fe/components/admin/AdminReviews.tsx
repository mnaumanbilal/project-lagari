"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { StarRating } from "@/components/storefront/StarRating";
import { StorefrontProductLink } from "@/components/storefront/StorefrontProductLink";
import { AdminBulkActionBar } from "@/components/admin/AdminBulkActionBar";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminPageToolbar } from "@/components/admin/AdminRefreshButton";
import { AdminProductEditLink } from "@/components/admin/AdminProductEditLink";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import {
  AdminReviewsToolbar,
  formatReviewDate,
  reviewToolbarToFetchParams,
  useReviewToolbarState,
} from "@/components/admin/AdminReviewsToolbar";
import { adminKeys } from "@/lib/admin/admin-query-keys";
import { toastBulkResult } from "@/lib/admin/bulk-result-toast";
import {
  useAdminReviews,
  useReviewAnalytics,
  useReviewLinkedOrder,
} from "@/lib/admin/hooks/use-admin-queries";
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

// ---------------------------------------------------------------------------
// Linked order expandable panel
// ---------------------------------------------------------------------------
function formatOrderDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatPkr(amount: number) {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function LinkedOrderPanel({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, error } = useReviewLinkedOrder(reviewId, open);

  return (
    <div className="mt-3 pl-7">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-xs text-lagari-brass hover:underline focus-visible:outline-none"
      >
        <span
          aria-hidden="true"
          className={`inline-block transition-transform duration-150 ${open ? "rotate-90" : ""}`}
        >
          ▶
        </span>
        {open ? "Hide linked order" : "View linked order"}
      </button>

      {open && (
        <div className="mt-3 rounded-sm border border-lagari-border bg-lagari-surface p-4">
          {isLoading && (
            <p className="animate-pulse text-xs text-lagari-muted">Loading order…</p>
          )}

          {isError && (
            <p className="text-xs text-lagari-danger">
              {error instanceof Error ? error.message : "Could not load order."}
            </p>
          )}

          {!isLoading && !isError && data === null && (
            <p className="text-xs text-lagari-muted">
              No qualifying order found for this customer and product.
            </p>
          )}

          {data && (
            <div className="space-y-4">
              {/* Order header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-lagari-primary">
                    Order #{data.orderNumber}
                  </p>
                  <p className="mt-0.5 text-xs text-lagari-muted">
                    {formatOrderDate(data.createdAt)} ·{" "}
                    <span
                      className={`font-medium ${
                        data.status === "delivered"
                          ? "text-lagari-brass"
                          : data.status === "cancelled"
                            ? "text-lagari-danger"
                            : "text-lagari-primary"
                      }`}
                    >
                      {STATUS_LABELS[data.status] ?? data.status}
                    </span>
                  </p>
                </div>
                <Link
                  href={`/admin-panel-route/orders/${data.orderId}`}
                  className="inline-flex items-center gap-1 rounded-sm border border-lagari-brass px-3 py-1.5 text-xs text-lagari-brass transition-colors hover:bg-lagari-brass/10"
                >
                  Go to order →
                </Link>
              </div>

              {/* Customer info */}
              <div className="grid gap-1 text-xs sm:grid-cols-2">
                <p className="text-lagari-muted">
                  <span className="font-medium text-lagari-primary">Customer: </span>
                  {data.customerName}
                </p>
                <p className="text-lagari-muted">
                  <span className="font-medium text-lagari-primary">Phone: </span>
                  {data.customerPhone}
                </p>
                {data.customerEmail && (
                  <p className="text-lagari-muted">
                    <span className="font-medium text-lagari-primary">Email: </span>
                    {data.customerEmail}
                  </p>
                )}
                <p className="text-lagari-muted">
                  <span className="font-medium text-lagari-primary">City: </span>
                  {data.shippingCity}
                </p>
              </div>

              {/* Line items */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-lagari-brass-dim">
                  Items
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[340px] text-xs">
                    <thead>
                      <tr className="border-b border-lagari-border text-left text-lagari-muted">
                        <th className="pb-1 pr-3 font-medium">Product</th>
                        <th className="pb-1 pr-3 font-medium">Variant</th>
                        <th className="pb-1 pr-3 text-right font-medium">Qty</th>
                        <th className="pb-1 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lagari-border/60">
                      {data.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-1.5 pr-3 text-lagari-primary">
                            {item.productTitleSnapshot}
                          </td>
                          <td className="py-1.5 pr-3 text-lagari-muted">
                            {item.variantNameSnapshot}
                          </td>
                          <td className="py-1.5 pr-3 text-right tabular-nums text-lagari-muted">
                            {item.quantity}
                          </td>
                          <td className="py-1.5 text-right tabular-nums text-lagari-primary">
                            {formatPkr(item.lineTotalPkr)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex flex-col items-end gap-0.5 border-t border-lagari-border pt-2 text-xs">
                <p className="text-lagari-muted">
                  Subtotal:{" "}
                  <span className="tabular-nums text-lagari-primary">
                    {formatPkr(data.subtotalPkr)}
                  </span>
                </p>
                {data.discountPkr > 0 && (
                  <p className="text-lagari-muted">
                    Discount:{" "}
                    <span className="tabular-nums text-lagari-danger">
                      −{formatPkr(data.discountPkr)}
                    </span>
                  </p>
                )}
                <p className="font-semibold text-lagari-primary">
                  Total:{" "}
                  <span className="tabular-nums">{formatPkr(data.totalPkr)}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminReviews() {
  const toast = useAdminToast();
  const { state, setState, patchState } = useReviewToolbarState();
  const [page, setPage] = useState(1);
  const fetchParams = useMemo(
    () => reviewToolbarToFetchParams(state, page),
    [state, page],
  );
  const { data, isLoading, isError, error, refetch } = useAdminReviews(fetchParams);
  const analyticsQuery = useReviewAnalytics({ preset: "last_7_days" });
  const reviews = data?.reviews ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 25;
  const totalPages = Math.max(1, Math.ceil(total / limit));

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
  const stats = analyticsQuery.data;
  const statsSyncing =
    analyticsQuery.isFetching && analyticsQuery.data !== undefined;

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

  const handleToolbarChange = useCallback(
    (next: typeof state) => {
      setPage(1);
      selection.clear();
      setState(next);
    },
    [selection.clear, setState],
  );

  const handleToolbarPatch = useCallback(
    (patch: Partial<typeof state>) => {
      setPage(1);
      selection.clear();
      patchState(patch);
    },
    [selection.clear, patchState],
  );

  return (
    <div>
      <AdminPageToolbar
        title="Reviews"
        description="Browse all reviews or work through the pending moderation queue."
        queryKey={adminKeys.reviews(fetchParams)}
      />

      {stats ? (
        <dl
          className={`mt-6 grid gap-3 transition-opacity sm:grid-cols-2 lg:grid-cols-4 ${
            statsSyncing ? "opacity-80" : ""
          }`}
        >
          <StatCard label="Pending moderation" value={String(stats.pendingCount)} />
          <StatCard label="Published total" value={String(stats.publishedCount)} />
          <StatCard
            label="Site average"
            value={
              stats.averageRatingSiteWide > 0
                ? `${stats.averageRatingSiteWide.toFixed(1)} ★`
                : "—"
            }
          />
          <StatCard
            label="Submitted (7 days)"
            value={String(stats.submittedInRange)}
          />
        </dl>
      ) : analyticsQuery.isLoading ? (
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="admin-card h-24 animate-pulse p-4" />
          ))}
        </dl>
      ) : null}

      <AdminReviewsToolbar
        state={state}
        onChange={handleToolbarChange}
        onPatch={handleToolbarPatch}
        pendingCount={stats?.pendingCount}
        publishedCount={stats?.publishedCount}
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

      {isError ? (
        <div
          role="alert"
          className="admin-card mt-6 border-lagari-danger/40 p-4 text-sm"
        >
          <p className="font-medium text-lagari-primary">
            Could not load reviews
          </p>
          <p className="mt-1 text-lagari-muted">
            {error instanceof Error ? error.message : "Please try again."}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="admin-btn mt-3 rounded-sm border border-lagari-border px-3 py-1.5 text-sm hover:border-lagari-brass"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <p className="mt-6 text-lagari-muted">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="mt-6 text-lagari-muted">
          {state.tab === "pending"
            ? "No pending reviews — you're all caught up."
            : "No reviews match these filters."}
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm text-lagari-muted">
            {total} review{total === 1 ? "" : "s"} · page {page} of {totalPages}
          </p>
          <ul className="mt-4 space-y-4">
            <li className="flex items-center gap-3 px-1 text-sm text-lagari-muted">
              <input
                type="checkbox"
                aria-label="Select all reviews on this page"
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
                        <StorefrontProductLink
                          slug={r.productSlug}
                          title={r.productTitle}
                          className="font-medium text-lagari-primary hover:text-lagari-brass hover:underline"
                        />
                        {r.productId ? (
                          <>
                            {" "}
                            <AdminProductEditLink
                              productId={r.productId}
                              className="text-xs text-lagari-muted hover:text-lagari-brass"
                            >
                              (edit)
                            </AdminProductEditLink>
                          </>
                        ) : null}
                      </p>
                      <p className="text-xs text-lagari-muted">{r.productSlug}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                        <StarRating value={r.rating} readonly size="sm" />
                        <span>{r.authorName}</span>
                        <span className="text-lagari-muted">· {r.source}</span>
                        <span className="text-lagari-muted">
                          · {formatReviewDate(r.createdAt)}
                        </span>
                        {r.isVerifiedPurchase && (
                          <span className="text-xs text-lagari-brass">
                            Verified purchase
                          </span>
                        )}
                        {state.tab === "all" && (
                          <span
                            className={`text-xs ${
                              r.isPublished
                                ? "text-lagari-muted"
                                : "text-lagari-brass"
                            }`}
                          >
                            {r.isPublished ? "Published" : "Pending"}
                          </span>
                        )}
                      </div>
                      {/* Contact snapshot — for admin traceability */}
                      {(r.contactPhoneNormalized || r.contactEmailNormalized) && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {r.contactPhoneNormalized && (
                            <span className="inline-flex items-center gap-1 rounded border border-lagari-border px-2 py-0.5 text-[11px] text-lagari-muted">
                              📞 {r.contactPhoneNormalized}
                            </span>
                          )}
                          {r.contactEmailNormalized && (
                            <span className="inline-flex items-center gap-1 rounded border border-lagari-border px-2 py-0.5 text-[11px] text-lagari-muted">
                              ✉ {r.contactEmailNormalized}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <AdminRowActionsMenu
                    menuLabel={`Actions for review by ${r.authorName}`}
                    actions={[
                      ...(state.tab === "pending" || !r.isPublished
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
                        : []),
                      ...(state.tab === "all" && r.isPublished
                        ? [
                            {
                              label: "Unpublish",
                              onClick: () =>
                                void patchReview.mutateAsync({
                                  id: r.id,
                                  isPublished: false,
                                }),
                              disabled: patchReview.isPending,
                            },
                          ]
                        : []),
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
                {r.isVerifiedPurchase && r.customerId && (
                  <LinkedOrderPanel reviewId={r.id} />
                )}
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="admin-btn rounded-sm border border-lagari-border px-3 py-1.5 text-sm disabled:opacity-40"
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
                className="admin-btn rounded-sm border border-lagari-border px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <AdminBulkActionBar
        selectedCount={selection.selectedCount}
        onClear={selection.clear}
      >
        {(state.tab === "pending" || state.tab === "all") && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void bulkPublish(true)}
            className="admin-btn rounded-sm border border-lagari-brass px-3 py-1.5 text-sm text-lagari-brass hover:bg-lagari-brass/10 disabled:opacity-50"
          >
            Publish selected
          </button>
        )}
        {state.tab === "all" && (
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-card p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-lagari-brass-dim">
        {label}
      </dt>
      <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-lagari-primary">
        {value}
      </dd>
    </div>
  );
}
