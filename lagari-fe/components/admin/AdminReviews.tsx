"use client";

import { useEffect, useState } from "react";
import { StarRating } from "@/components/storefront/StarRating";
import {
  deleteAdminReview,
  fetchAdminReviews,
  importShopifyReviews,
  patchAdminReview,
  type AdminReview,
} from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { getValidAccessToken } from "@/lib/admin/token-storage";
import { useAdminToast } from "@/lib/admin/admin-toast-context";

export function AdminReviews() {
  const { accessToken } = useAdminAuth();
  const toast = useAdminToast();
  const [tab, setTab] = useState<"pending" | "published">("pending");
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function reload() {
    const token = getValidAccessToken() ?? accessToken;
    if (!token) return;
    fetchAdminReviews(token, tab).then(setReviews);
  }

  useEffect(() => {
    reload();
  }, [accessToken, tab]);

  async function handleImport(file: File) {
    const token = getValidAccessToken() ?? accessToken;
    if (!token) return;
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
      const result = await importShopifyReviews(token, rows, true);
      setImportMsg(`Imported ${result.imported}, skipped ${result.skipped}`);
      toast.success(`Imported ${result.imported} review(s).`);
      reload();
    } catch {
      setImportMsg("Import failed — use CSV or JSON export format.");
      toast.error("Import failed — check file format.");
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Reviews</h1>
      <p className="mt-2 max-w-2xl text-sm text-lagari-muted">
        Customer reviews are held for moderation unless the buyer has a verified
        order for that product. Publish or delete from the queues below.
      </p>

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
            onClick={() => setTab(t)}
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

      <ul className="mt-6 space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="admin-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {r.productTitle}{" "}
                  <span className="text-sm text-lagari-muted">({r.productSlug})</span>
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <StarRating value={r.rating} readonly size="sm" />
                  <span>{r.authorName}</span>
                  <span className="text-lagari-muted">· {r.source}</span>
                  {r.isVerifiedPurchase && (
                    <span className="text-xs text-lagari-brass">Verified purchase</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {tab === "pending" && (
                  <button
                    type="button"
                    className="text-sm font-medium text-lagari-brass"
                    onClick={async () => {
                      const token = getValidAccessToken() ?? accessToken;
                      if (!token) return;
                      await patchAdminReview(token, r.id, true);
                      reload();
                    }}
                  >
                    Publish
                  </button>
                )}
                {tab === "published" && (
                  <button
                    type="button"
                    className="text-sm font-medium text-lagari-muted"
                    onClick={async () => {
                      const token = getValidAccessToken() ?? accessToken;
                      if (!token) return;
                      await patchAdminReview(token, r.id, false);
                      reload();
                    }}
                  >
                    Unpublish
                  </button>
                )}
                <button
                  type="button"
                  className="text-sm font-medium text-red-600"
                  onClick={async () => {
                    const token = getValidAccessToken() ?? accessToken;
                    if (!token) return;
                    await deleteAdminReview(token, r.id);
                    reload();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm text-lagari-muted">{r.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
