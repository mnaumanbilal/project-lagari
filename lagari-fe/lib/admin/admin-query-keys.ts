import type { AnalyticsRangeParams } from "@/lib/api/admin";
import type { FetchAdminOrdersParams } from "@/lib/api/admin";

export const adminKeys = {
  all: ["admin"] as const,
  metrics: () => [...adminKeys.all, "metrics"] as const,
  orders: (params: FetchAdminOrdersParams = {}) =>
    [...adminKeys.all, "orders", params] as const,
  ordersAll: () => [...adminKeys.all, "orders"] as const,
  order: (id: string) => [...adminKeys.all, "order", id] as const,
  products: () => [...adminKeys.all, "products"] as const,
  product: (id: string) => [...adminKeys.all, "product", id] as const,
  reviews: (tab: "pending" | "published") =>
    [...adminKeys.all, "reviews", tab] as const,
  analytics: (range: AnalyticsRangeParams) =>
    [...adminKeys.all, "analytics", range] as const,
};
