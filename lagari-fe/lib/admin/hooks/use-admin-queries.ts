"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchAdminAnalytics,
  fetchAdminMetrics,
  fetchAdminOrder,
  fetchAdminOrders,
  fetchAdminProduct,
  fetchAdminProducts,
  fetchAdminReviews,
  fetchReviewAnalytics,
  fetchReviewLinkedOrder,
  type AnalyticsRangeParams,
  type FetchAdminReviewsParams,
  type FetchAdminOrdersParams,
} from "@/lib/api/admin";
import { adminKeys } from "@/lib/admin/admin-query-keys";
import { useAdminToken } from "@/lib/admin/hooks/use-admin-token";

export function useAdminMetrics() {
  const token = useAdminToken();
  return useQuery({
    queryKey: adminKeys.metrics(),
    queryFn: () => fetchAdminMetrics(token!),
    enabled: !!token,
  });
}

export function useAdminOrders(params: FetchAdminOrdersParams = {}) {
  const token = useAdminToken();
  return useQuery({
    queryKey: adminKeys.orders(params),
    queryFn: () => fetchAdminOrders(token!, params),
    enabled: !!token,
  });
}

export function useAdminOrder(id: string | undefined) {
  const token = useAdminToken();
  return useQuery({
    queryKey: adminKeys.order(id ?? ""),
    queryFn: () => fetchAdminOrder(token!, id!),
    enabled: !!token && !!id,
  });
}

export function useAdminProducts() {
  const token = useAdminToken();
  return useQuery({
    queryKey: adminKeys.products(),
    queryFn: () => fetchAdminProducts(token!),
    enabled: !!token,
  });
}

export function useAdminProduct(id: string | undefined) {
  const token = useAdminToken();
  return useQuery({
    queryKey: adminKeys.product(id ?? ""),
    queryFn: () => fetchAdminProduct(token!, id!),
    enabled: !!token && !!id,
  });
}

export function useAdminReviews(params: FetchAdminReviewsParams) {
  const token = useAdminToken();
  return useQuery({
    queryKey: adminKeys.reviews(params),
    queryFn: () => fetchAdminReviews(token!, params),
    enabled: !!token,
  });
}

export function useReviewAnalytics(range: AnalyticsRangeParams) {
  const token = useAdminToken();
  return useQuery({
    queryKey: adminKeys.reviewAnalytics(range),
    queryFn: () => fetchReviewAnalytics(token!, range),
    enabled: !!token,
    staleTime: 30_000,
  });
}

/**
 * Lazily fetch the order backing a verified purchase review.
 * Only fires when `enabled` is true — typically when the admin expands the panel.
 */
export function useReviewLinkedOrder(
  reviewId: string,
  enabled: boolean,
) {
  const token = useAdminToken();
  return useQuery({
    queryKey: adminKeys.reviewLinkedOrder(reviewId),
    queryFn: () => fetchReviewLinkedOrder(token!, reviewId),
    enabled: !!token && !!reviewId && enabled,
    staleTime: 60_000,
    retry: false,
  });
}

export function useAdminAnalytics(range: AnalyticsRangeParams) {
  const token = useAdminToken();
  return useQuery({
    queryKey: adminKeys.analytics(range),
    queryFn: () => fetchAdminAnalytics(token!, range),
    enabled: !!token,
  });
}
