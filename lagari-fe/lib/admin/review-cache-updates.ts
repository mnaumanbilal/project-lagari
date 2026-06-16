import type { QueryClient } from "@tanstack/react-query";
import { adminKeys } from "@/lib/admin/admin-query-keys";
import type {
  AdminMetrics,
  AdminReview,
  AdminReviewsListResponse,
  AnalyticsOverview,
  ReviewAnalyticsMetrics,
} from "@/lib/api/admin";

export type ReviewCountDelta = {
  pending: number;
  published: number;
};

function clampNonNegative(n: number): number {
  return Math.max(0, n);
}

/** Find a review row in any cached admin reviews list query. */
export function findAdminReviewInCache(
  queryClient: QueryClient,
  reviewId: string,
): AdminReview | undefined {
  const entries = queryClient.getQueriesData<AdminReviewsListResponse>({
    queryKey: adminKeys.reviewsAll(),
  });
  for (const [, data] of entries) {
    const hit = data?.reviews.find((r) => r.id === reviewId);
    if (hit) return hit;
  }
  return undefined;
}

/** Immediately adjust pending/published counts in all review-related caches. */
export function patchReviewCountsInCache(
  queryClient: QueryClient,
  delta: ReviewCountDelta,
): void {
  if (delta.pending === 0 && delta.published === 0) return;

  queryClient.setQueriesData<ReviewAnalyticsMetrics>(
    { queryKey: adminKeys.reviewAnalyticsAll() },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pendingCount: clampNonNegative(old.pendingCount + delta.pending),
        publishedCount: clampNonNegative(old.publishedCount + delta.published),
      };
    },
  );

  queryClient.setQueryData<AdminMetrics>(adminKeys.metrics(), (old) => {
    if (!old) return old;
    return {
      ...old,
      pendingReviews: clampNonNegative(old.pendingReviews + delta.pending),
    };
  });

  queryClient.setQueriesData<AnalyticsOverview>(
    { queryKey: adminKeys.analyticsAll() },
    (old) => {
      if (!old?.reviewMetrics) return old;
      return {
        ...old,
        reviewMetrics: {
          ...old.reviewMetrics,
          pendingCount: clampNonNegative(
            old.reviewMetrics.pendingCount + delta.pending,
          ),
          publishedCount: clampNonNegative(
            old.reviewMetrics.publishedCount + delta.published,
          ),
        },
      };
    },
  );
}

export function deltaForPublishToggle(
  wasPublished: boolean,
  isPublished: boolean,
): ReviewCountDelta {
  if (!wasPublished && isPublished) return { pending: -1, published: 1 };
  if (wasPublished && !isPublished) return { pending: 1, published: -1 };
  return { pending: 0, published: 0 };
}

export function deltaForDelete(review: AdminReview): ReviewCountDelta {
  return review.isPublished
    ? { pending: 0, published: -1 }
    : { pending: -1, published: 0 };
}

export function deltaForBulkPublish(
  count: number,
  isPublished: boolean,
): ReviewCountDelta {
  if (count <= 0) return { pending: 0, published: 0 };
  return isPublished
    ? { pending: -count, published: count }
    : { pending: count, published: -count };
}

export async function refetchReviewStats(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.refetchQueries({ queryKey: adminKeys.reviewAnalyticsAll() }),
    queryClient.refetchQueries({ queryKey: adminKeys.metrics() }),
    queryClient.refetchQueries({ queryKey: adminKeys.reviewsAll() }),
    queryClient.refetchQueries({ queryKey: adminKeys.products() }),
    queryClient.refetchQueries({ queryKey: adminKeys.analyticsAll() }),
  ]);
}
