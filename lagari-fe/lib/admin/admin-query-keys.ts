import type { AnalyticsRangeParams, FetchAdminOrdersParams, FetchAdminReviewsParams } from "@/lib/api/admin";

export const adminKeys = {
  all: ["admin"] as const,
  metrics: () => [...adminKeys.all, "metrics"] as const,
  orders: (params: FetchAdminOrdersParams = {}) =>
    [...adminKeys.all, "orders", params] as const,
  ordersAll: () => [...adminKeys.all, "orders"] as const,
  order: (id: string) => [...adminKeys.all, "order", id] as const,
  products: () => [...adminKeys.all, "products"] as const,
  product: (id: string) => [...adminKeys.all, "product", id] as const,
  reviews: (params: FetchAdminReviewsParams) =>
    [...adminKeys.all, "reviews", params] as const,
  reviewsAll: () => [...adminKeys.all, "reviews"] as const,
  reviewAnalyticsAll: () => [...adminKeys.all, "review-analytics"] as const,
  reviewAnalytics: (range: AnalyticsRangeParams) =>
    [...adminKeys.all, "review-analytics", range] as const,
  analyticsAll: () => [...adminKeys.all, "analytics"] as const,
  analytics: (range: AnalyticsRangeParams) =>
    [...adminKeys.all, "analytics", range] as const,
  reviewLinkedOrder: (reviewId: string) =>
    [...adminKeys.all, "review-linked-order", reviewId] as const,
};
