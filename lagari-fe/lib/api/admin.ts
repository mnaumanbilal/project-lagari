import { adminApiFetch } from "./admin-client";
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
  customerEmail: string | null;
  shippingCity: string;
  itemCount: number;
  itemPreview: string;
  createdAt: string;
};

export type AdminOrderItem = {
  id: string;
  variantId: string;
  productTitleSnapshot: string;
  variantNameSnapshot: string;
  unitPricePkr: number;
  quantity: number;
  lineTotalPkr: number;
};

export type AdminOrderTimelineEvent = {
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  message: string;
  createdAt: string;
};

export type AdminOrderDetail = AdminOrderRow & {
  subtotalPkr: number;
  discountPkr: number;
  shippingAddress: string;
  courierName: string | null;
  trackingNumber: string | null;
  adminNotes: string | null;
  items: AdminOrderItem[];
  timeline: AdminOrderTimelineEvent[];
  allowedNextStatuses: string[];
};

export type AdminOrdersListResponse = {
  orders: AdminOrderRow[];
  total: number;
  page: number;
  limit: number;
};

export type AdminOrderStatusPatch = {
  status: string;
  note?: string;
  courierName?: string;
  trackingNumber?: string;
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

export type AnalyticsTopProduct = {
  productSlug: string;
  productId: string | null;
  productTitle: string;
  uniqueViewers: number;
  totalViews: number;
  addToCartSessions: number;
};

export type AnalyticsOverview = {
  rangeDays: number;
  from: string;
  to: string;
  uniqueVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  activeSessions: number;
  cancelledOrders: number;
  ordersPlacedInRange: number;
  productViewSessions: number;
  addToCartSessions: number;
  checkoutStarts: number;
  checkoutConversions: number;
  orderPlacedSessions: number;
  cartDropOffRate: number;
  checkoutConversionRate: number;
  viewToCartRate: number;
  cartToCheckoutRate: number;
  cartAbandonmentRate: number;
  overallConversionRate: number;
  topProducts: AnalyticsTopProduct[];
  topSearches: Array<{ query: string; uniqueSessions: number }>;
  categoryInterest: Array<{ category: string; uniqueSessions: number }>;
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
  return adminApiFetch<AdminMetrics>("/admin/metrics/summary", authHeaders(accessToken));
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Coerce API payload — supports legacy overview shape from older backends. */
export function normalizeAnalyticsOverview(
  raw: Partial<AnalyticsOverview> & {
    topProductsByViews?: Array<{ productSlug: string; views: number }>;
  },
): AnalyticsOverview {
  const legacyViews = raw.topProductsByViews ?? [];
  const topProducts =
    raw.topProducts ??
    legacyViews.map((row) => ({
      productSlug: row.productSlug,
      productId: null,
      productTitle: row.productSlug,
      uniqueViewers: row.views,
      totalViews: row.views,
      addToCartSessions: 0,
    }));

  const uniqueVisitors = num(raw.uniqueVisitors, num(raw.newVisitors));

  return {
    rangeDays: num(raw.rangeDays, 7),
    from: raw.from ?? "",
    to: raw.to ?? "",
    uniqueVisitors,
    newVisitors: num(raw.newVisitors),
    returningVisitors: num(
      raw.returningVisitors,
      Math.max(0, uniqueVisitors - num(raw.newVisitors)),
    ),
    activeSessions: num(raw.activeSessions),
    cancelledOrders: num(raw.cancelledOrders),
    ordersPlacedInRange: num(raw.ordersPlacedInRange),
    productViewSessions: num(raw.productViewSessions),
    addToCartSessions: num(raw.addToCartSessions),
    checkoutStarts: num(raw.checkoutStarts),
    checkoutConversions: num(raw.checkoutConversions),
    orderPlacedSessions: num(raw.orderPlacedSessions),
    cartDropOffRate: num(raw.cartDropOffRate),
    checkoutConversionRate: num(
      raw.checkoutConversionRate,
      raw.checkoutStarts
        ? Math.round(
            (num(raw.checkoutConversions) / num(raw.checkoutStarts)) * 1000,
          ) / 10
        : 0,
    ),
    viewToCartRate: num(raw.viewToCartRate),
    cartToCheckoutRate: num(raw.cartToCheckoutRate),
    cartAbandonmentRate: num(raw.cartAbandonmentRate),
    overallConversionRate: num(raw.overallConversionRate),
    topProducts,
    topSearches: raw.topSearches ?? [],
    categoryInterest: raw.categoryInterest ?? [],
    topProductsByViews: legacyViews,
  };
}

export async function fetchAdminAnalytics(
  accessToken: string,
  days: 7 | 30 = 7,
): Promise<AnalyticsOverview> {
  const raw = await adminApiFetch<Partial<AnalyticsOverview>>(
    `/admin/analytics/overview?days=${days}`,
    authHeaders(accessToken),
  );
  return normalizeAnalyticsOverview(raw);
}

export type FetchAdminOrdersParams = {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export async function fetchAdminOrders(
  accessToken: string,
  params: FetchAdminOrdersParams = {},
): Promise<AdminOrdersListResponse> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  const q = searchParams.toString();
  const raw = await adminApiFetch<AdminOrdersListResponse | AdminOrderRow[]>(
    `/admin/orders${q ? `?${q}` : ""}`,
    authHeaders(accessToken),
  );
  if (Array.isArray(raw)) {
    return { orders: raw, total: raw.length, page: 1, limit: raw.length || 50 };
  }
  return raw;
}

export async function fetchAdminOrder(
  accessToken: string,
  id: string,
): Promise<AdminOrderDetail> {
  return adminApiFetch<AdminOrderDetail>(`/admin/orders/${id}`, authHeaders(accessToken));
}

export async function patchAdminOrderStatus(
  accessToken: string,
  id: string,
  patch: AdminOrderStatusPatch,
): Promise<AdminOrderDetail> {
  return adminApiFetch<AdminOrderDetail>(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(patch),
    ...authHeaders(accessToken),
  });
}

export async function patchAdminOrderNotes(
  accessToken: string,
  id: string,
  adminNotes: string | null,
): Promise<AdminOrderDetail> {
  return adminApiFetch<AdminOrderDetail>(`/admin/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ adminNotes }),
    ...authHeaders(accessToken),
  });
}

export async function fetchAdminProducts(
  accessToken: string,
): Promise<AdminProduct[]> {
  return adminApiFetch<AdminProduct[]>("/admin/products", authHeaders(accessToken));
}

export async function fetchAdminProduct(
  accessToken: string,
  id: string,
): Promise<AdminProduct> {
  return adminApiFetch<AdminProduct>(`/admin/products/${id}`, authHeaders(accessToken));
}

export async function createAdminProduct(
  accessToken: string,
  body: Record<string, unknown>,
): Promise<AdminProduct> {
  return adminApiFetch<AdminProduct>("/admin/products", {
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
  return adminApiFetch<AdminProduct>(`/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    ...authHeaders(accessToken),
  });
}

export async function deleteAdminProduct(
  accessToken: string,
  id: string,
): Promise<void> {
  return adminApiFetch(`/admin/products/${id}`, {
    method: "DELETE",
    ...authHeaders(accessToken),
  });
}

export async function fetchAdminReviews(
  accessToken: string,
  status: "pending" | "published",
): Promise<AdminReview[]> {
  return adminApiFetch<AdminReview[]>(
    `/admin/reviews?status=${status}`,
    authHeaders(accessToken),
  );
}

export async function patchAdminReview(
  accessToken: string,
  id: string,
  isPublished: boolean,
): Promise<unknown> {
  return adminApiFetch(`/admin/reviews/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ isPublished }),
    ...authHeaders(accessToken),
  });
}

export async function deleteAdminReview(
  accessToken: string,
  id: string,
): Promise<void> {
  return adminApiFetch(`/admin/reviews/${id}`, {
    method: "DELETE",
    ...authHeaders(accessToken),
  });
}

export async function importShopifyReviews(
  accessToken: string,
  reviews: Array<Record<string, unknown>>,
  publishByDefault = true,
): Promise<{ imported: number; skipped: number }> {
  return adminApiFetch("/admin/reviews/import-shopify", {
    method: "POST",
    body: JSON.stringify({ reviews, publishByDefault }),
    ...authHeaders(accessToken),
  });
}
