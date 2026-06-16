"use client";

import Link from "next/link";
import { StarRating } from "@/components/storefront/StarRating";
import { StorefrontProductLink } from "@/components/storefront/StorefrontProductLink";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { formatReviewDate } from "@/components/admin/AdminReviewsToolbar";
import { ADMIN_REVIEWS_PATH } from "@/lib/admin/constants";
import { useAdminReviews } from "@/lib/admin/hooks/use-admin-queries";
import {
  useDeleteAdminReview,
  usePatchAdminReview,
} from "@/lib/admin/hooks/use-admin-mutations";
import { ProductRatingSummary } from "@/components/storefront/ProductRatingSummary";
import type { ReviewSummary } from "@/lib/types/catalog";

type Props = {
  productSlug: string;
  productTitle: string;
  reviewSummary: ReviewSummary | null | undefined;
};

export function AdminProductReviewsPanel({
  productSlug,
  productTitle,
  reviewSummary,
}: Props) {
  const reviewsQuery = useAdminReviews({
    status: "all",
    productSearch: productSlug,
    limit: 10,
  });
  const patchReview = usePatchAdminReview();
  const deleteReview = useDeleteAdminReview();

  const rows = reviewsQuery.data?.reviews ?? [];
  const loading = reviewsQuery.isLoading;

  return (
    <section className="admin-card mt-10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-lagari-primary">
            Reviews for this product
          </h2>
          <ProductRatingSummary summary={reviewSummary} size="sm" className="mt-2" />
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <StorefrontProductLink
            slug={productSlug}
            title="View on shop"
            className="font-medium text-lagari-brass hover:underline"
          />
          <Link
            href={`${ADMIN_REVIEWS_PATH}?product=${encodeURIComponent(productSlug)}`}
            className="font-medium text-lagari-brass hover:underline"
          >
            All reviews →
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-lagari-muted">Loading reviews…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-lagari-muted">
          No reviews for {productTitle} yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-sm border border-lagari-border/80 bg-lagari-elevated/20 p-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StarRating value={r.rating} readonly size="sm" />
                    <span className="font-medium">{r.authorName}</span>
                    {!r.isPublished && (
                      <span className="text-xs text-lagari-brass">Pending</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-lagari-muted">
                    {formatReviewDate(r.createdAt)}
                  </p>
                </div>
                <AdminRowActionsMenu
                  menuLabel={`Review actions`}
                  actions={[
                    ...(!r.isPublished
                      ? [
                          {
                            label: "Publish",
                            onClick: () =>
                              void patchReview.mutateAsync({
                                id: r.id,
                                isPublished: true,
                              }),
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
                          },
                        ]),
                    {
                      label: "Delete",
                      onClick: () => void deleteReview.mutateAsync(r.id),
                      variant: "destructive" as const,
                    },
                  ]}
                />
              </div>
              <p className="mt-2 text-lagari-muted">{r.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
