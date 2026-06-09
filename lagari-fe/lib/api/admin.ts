import { apiFetch } from "./client";
import type { CatalogProduct } from "@/lib/types/catalog";

export type AdminMetrics = {
  ordersToday: number;
  revenueTodayPkr: number;
  pendingOrders: number;
  lowStockCount: number;
  activeSessions: number;
};

export type AdminOrderRow = {
  id: string;
  orderNumber: number;
  status: string;
  totalPkr: number;
  customerName: string;
  customerPhone: string;
  createdAt: string;
};

export type AdminOrderDetail = AdminOrderRow & {
  subtotalPkr: number;
  discountPkr: number;
  shippingCity: string;
  shippingAddress: string;
  items: Array<{
    id: string;
    productTitleSnapshot: string;
    variantNameSnapshot: string;
    unitPricePkr: number;
    quantity: number;
  }>;
  timeline: Array<{ message: string; createdAt: string }>;
};

export type AdminProduct = Omit<CatalogProduct, "images"> & {
  id: string;
  isPublished?: boolean;
  description?: string | null;
  categories?: string[];
  noteTags?: string[];
  images?: Array<{ url: string; isHero: boolean; sortOrder?: number }>;
  createdAt?: string;
};

export type AnalyticsOverview = {
  rangeDays: number;
  from: string;
  to: string;
  newVisitors: number;
  activeSessions: number;
  cancelledOrders: number;
  cartDropOffRate: number;
  checkoutStarts: number;
  checkoutConversions: number;
  topProductsByViews: Array<{ productSlug: string; views: number }>;
};

export type AdminReview = {
  id: string;
  productSlug: string;
  productTitle: string;
  authorName: string;
  rating: number;
  body: string;
  source: string;
  isPublished: boolean;
  isVerifiedPurchase: boolean;
  createdAt: string;
};

function authHeaders(accessToken: string) {
  return { accessToken };
}

export async function fetchAdminMetrics(
  accessToken: string,
): Promise<AdminMetrics> {
  return apiFetch<AdminMetrics>("/admin/metrics/summary", authHeaders(accessToken));
}

export async function fetchAdminAnalytics(
  accessToken: string,
  days: 7 | 30 = 7,
): Promise<AnalyticsOverview> {
  return apiFetch<AnalyticsOverview>(
    `/admin/analytics/overview?days=${days}`,
    authHeaders(accessToken),
  );
}

export async function fetchAdminOrders(
  accessToken: string,
  status?: string,
): Promise<AdminOrderRow[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<AdminOrderRow[]>(`/admin/orders${q}`, authHeaders(accessToken));
}

export async function fetchAdminOrder(
  accessToken: string,
  id: string,
): Promise<AdminOrderDetail> {
  return apiFetch<AdminOrderDetail>(`/admin/orders/${id}`, authHeaders(accessToken));
}

export async function patchAdminOrderStatus(
  accessToken: string,
  id: string,
  status: string,
  note?: string,
): Promise<unknown> {
  return apiFetch(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
    ...authHeaders(accessToken),
  });
}

export async function fetchAdminProducts(
  accessToken: string,
): Promise<AdminProduct[]> {
  return apiFetch<AdminProduct[]>("/admin/products", authHeaders(accessToken));
}

export async function fetchAdminProduct(
  accessToken: string,
  id: string,
): Promise<AdminProduct> {
  return apiFetch<AdminProduct>(`/admin/products/${id}`, authHeaders(accessToken));
}

export async function createAdminProduct(
  accessToken: string,
  body: Record<string, unknown>,
): Promise<AdminProduct> {
  return apiFetch<AdminProduct>("/admin/products", {
    method: "POST",
    body: JSON.stringify(body),
    ...authHeaders(accessToken),
  });
}

export async function updateAdminProduct(
  accessToken: string,
  id: string,
  body: Record<string, unknown>,
): Promise<AdminProduct> {
  return apiFetch<AdminProduct>(`/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    ...authHeaders(accessToken),
  });
}

export async function deleteAdminProduct(
  accessToken: string,
  id: string,
): Promise<void> {
  return apiFetch(`/admin/products/${id}`, {
    method: "DELETE",
    ...authHeaders(accessToken),
  });
}

export async function fetchAdminReviews(
  accessToken: string,
  status: "pending" | "published",
): Promise<AdminReview[]> {
  return apiFetch<AdminReview[]>(
    `/admin/reviews?status=${status}`,
    authHeaders(accessToken),
  );
}

export async function patchAdminReview(
  accessToken: string,
  id: string,
  isPublished: boolean,
): Promise<unknown> {
  return apiFetch(`/admin/reviews/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ isPublished }),
    ...authHeaders(accessToken),
  });
}

export async function deleteAdminReview(
  accessToken: string,
  id: string,
): Promise<void> {
  return apiFetch(`/admin/reviews/${id}`, {
    method: "DELETE",
    ...authHeaders(accessToken),
  });
}

export async function importShopifyReviews(
  accessToken: string,
  reviews: Array<Record<string, unknown>>,
  publishByDefault = true,
): Promise<{ imported: number; skipped: number }> {
  return apiFetch("/admin/reviews/import-shopify", {
    method: "POST",
    body: JSON.stringify({ reviews, publishByDefault }),
    ...authHeaders(accessToken),
  });
}
