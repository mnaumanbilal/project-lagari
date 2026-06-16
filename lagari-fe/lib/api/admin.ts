import { adminApiFetch } from "./admin-client";
import type { CatalogProduct, ReviewSummary } from "@/lib/types/catalog";

export type AdminMetrics = {
  ordersToday: number;
  revenueTodayPkr: number;
  pendingOrders: number;
  lowStockCount: number;
  activeSessions: number;
  pendingReviews: number;
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
  archivedAt: string | null;
};

export type AdminBulkActionResult = {
  succeeded: number;
  failed: Array<{ id: string; error: string }>;
};

export type AdminOrderItem = {
  id: string;
  variantId: string;
  productTitleSnapshot: string;
  productSlugSnapshot: string | null;
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
  cancelReason: string | null;
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
  cancelReason?: string;
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

export type AnalyticsPreset =
  | "this_week"
  | "last_7_days"
  | "this_month"
  | "this_year"
  | "last_30_days";

export type AnalyticsRangeParams =
  | { preset: AnalyticsPreset }
  | { from: string; to: string };

export type AnalyticsOverview = {
  preset: AnalyticsPreset | null;
  label: string;
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
  viewThenCartSessions: number;
  checkoutStarts: number;
  cartThenCheckoutSessions: number;
  checkoutConversions: number;
  orderPlacedSessions: number;
  cartDropOffRate: number;
  checkoutConversionRate: number;
  viewToCartRate: number;
  cartToCheckoutRate: number;
  cartAbandonmentRate: number;
  overallConversionRate: number;
  dataQualityWarnings: string[];
  topProducts: AnalyticsTopProduct[];
  topSearches: Array<{ query: string; uniqueSessions: number }>;
  categoryInterest: Array<{ category: string; uniqueSessions: number }>;
  topProductsByViews: Array<{ productSlug: string; views: number }>;
  reviewMetrics?: ReviewAnalyticsMetrics;
};

export type ReviewAnalyticsProductRow = {
  productId: string;
  productSlug: string;
  productTitle: string;
  averageRating: number;
  reviewCount: number;
};

export type ReviewAnalyticsMetrics = {
  pendingCount: number;
  publishedCount: number;
  submittedInRange: number;
  averageRatingSiteWide: number;
  verifiedShare: number;
  ratingDistribution: Record<string, number>;
  topRatedProducts: ReviewAnalyticsProductRow[];
  mostReviewedProducts: ReviewAnalyticsProductRow[];
};

export type AdminReview = {
  id: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  /** FK to customers — null for Shopify-imported reviews */
  customerId: string | null;
  authorName: string;
  rating: number;
  body: string;
  source: string;
  isPublished: boolean;
  isVerifiedPurchase: boolean;
  createdAt: string;
  /** Contact used at submission — visible to admin only */
  contactPhoneNormalized: string | null;
  contactEmailNormalized: string | null;
};

export type ReviewLinkedOrderItem = {
  id: string;
  productTitleSnapshot: string;
  variantNameSnapshot: string;
  quantity: number;
  unitPricePkr: number;
  lineTotalPkr: number;
};

export type ReviewLinkedOrder = {
  orderId: string;
  orderNumber: number;
  status: string;
  createdAt: string;
  totalPkr: number;
  subtotalPkr: number;
  discountPkr: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingCity: string;
  shippingAddress: string;
  items: ReviewLinkedOrderItem[];
};

export type FetchAdminReviewsParams = {
  status: "all" | "pending" | "published";
  /** Partial match on product slug or title (case-insensitive). */
  productSearch?: string;
  from?: string;
  to?: string;
  sort?: "newest" | "oldest" | "rating_high" | "rating_low";
  ratingMin?: number;
  ratingMax?: number;
  page?: number;
  limit?: number;
};

export type AdminReviewsListResponse = {
  reviews: AdminReview[];
  total: number;
  page: number;
  limit: number;
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
    preset: (raw.preset as AnalyticsPreset | null | undefined) ?? null,
    label: raw.label ?? "",
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
    viewThenCartSessions: num(
      raw.viewThenCartSessions,
      num(raw.addToCartSessions),
    ),
    checkoutStarts: num(raw.checkoutStarts),
    cartThenCheckoutSessions: num(
      raw.cartThenCheckoutSessions,
      num(raw.checkoutStarts),
    ),
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
    dataQualityWarnings: raw.dataQualityWarnings ?? [],
    topProducts,
    topSearches: raw.topSearches ?? [],
    categoryInterest: raw.categoryInterest ?? [],
    topProductsByViews: legacyViews,
    reviewMetrics: raw.reviewMetrics,
  };
}

function buildAnalyticsQuery(range: AnalyticsRangeParams): string {
  if ("preset" in range) {
    return `preset=${range.preset}`;
  }
  const params = new URLSearchParams();
  params.set("from", range.from);
  params.set("to", range.to);
  return params.toString();
}

export async function fetchAdminAnalytics(
  accessToken: string,
  range: AnalyticsRangeParams = { preset: "last_7_days" },
): Promise<AnalyticsOverview> {
  const raw = await adminApiFetch<Partial<AnalyticsOverview>>(
    `/admin/analytics/overview?${buildAnalyticsQuery(range)}`,
    authHeaders(accessToken),
  );
  return normalizeAnalyticsOverview(raw);
}

export type FetchAdminOrdersParams = {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  archived?: "true" | "false" | "all";
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
  if (params.archived) searchParams.set("archived", params.archived);
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

export async function bulkDeleteAdminProducts(
  accessToken: string,
  ids: string[],
): Promise<AdminBulkActionResult> {
  return adminApiFetch<AdminBulkActionResult>("/admin/products/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
    ...authHeaders(accessToken),
  });
}

export async function archiveAdminOrder(
  accessToken: string,
  id: string,
  archived: boolean,
): Promise<AdminOrderDetail> {
  return adminApiFetch<AdminOrderDetail>(`/admin/orders/${id}/archive`, {
    method: "PATCH",
    body: JSON.stringify({ archived }),
    ...authHeaders(accessToken),
  });
}

export async function bulkArchiveAdminOrders(
  accessToken: string,
  ids: string[],
  archived: boolean,
): Promise<AdminBulkActionResult> {
  return adminApiFetch<AdminBulkActionResult>("/admin/orders/bulk-archive", {
    method: "POST",
    body: JSON.stringify({ ids, archived }),
    ...authHeaders(accessToken),
  });
}

export async function fetchAdminReviews(
  accessToken: string,
  params: FetchAdminReviewsParams,
): Promise<AdminReviewsListResponse> {
  const q = new URLSearchParams({ status: params.status });
  if (params.productSearch) q.set("productSearch", params.productSearch);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.sort) q.set("sort", params.sort);
  if (params.ratingMin != null) q.set("ratingMin", String(params.ratingMin));
  if (params.ratingMax != null) q.set("ratingMax", String(params.ratingMax));
  if (params.page != null) q.set("page", String(params.page));
  if (params.limit != null) q.set("limit", String(params.limit));
  return adminApiFetch<AdminReviewsListResponse>(
    `/admin/reviews?${q.toString()}`,
    authHeaders(accessToken),
  );
}

export async function fetchReviewAnalytics(
  accessToken: string,
  range: AnalyticsRangeParams,
): Promise<ReviewAnalyticsMetrics> {
  const q =
    "preset" in range
      ? new URLSearchParams({ preset: range.preset })
      : new URLSearchParams({ from: range.from, to: range.to });
  return adminApiFetch<ReviewAnalyticsMetrics>(
    `/admin/reviews/analytics?${q.toString()}`,
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

export async function bulkDeleteAdminReviews(
  accessToken: string,
  ids: string[],
): Promise<AdminBulkActionResult> {
  return adminApiFetch<AdminBulkActionResult>("/admin/reviews/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
    ...authHeaders(accessToken),
  });
}

export async function bulkPatchAdminReviews(
  accessToken: string,
  ids: string[],
  isPublished: boolean,
): Promise<AdminBulkActionResult> {
  return adminApiFetch<AdminBulkActionResult>("/admin/reviews/bulk-patch", {
    method: "POST",
    body: JSON.stringify({ ids, isPublished }),
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

/**
 * Returns the most recent qualifying order that backs a verified review.
 * Returns null (404) when no linked order could be found.
 */
export async function fetchReviewLinkedOrder(
  accessToken: string,
  reviewId: string,
): Promise<ReviewLinkedOrder | null> {
  try {
    return await adminApiFetch<ReviewLinkedOrder>(
      `/admin/reviews/${reviewId}/linked-order`,
      authHeaders(accessToken),
    );
  } catch (err: unknown) {
    // 404 means no linked order — not a hard error
    if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404) return null;
    throw err;
  }
}
