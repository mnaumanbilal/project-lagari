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
  type AnalyticsRangeParams,
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

export function useAdminReviews(tab: "pending" | "published") {
  const token = useAdminToken();
  return useQuery({
    queryKey: adminKeys.reviews(tab),
    queryFn: () => fetchAdminReviews(token!, tab),
    enabled: !!token,
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
