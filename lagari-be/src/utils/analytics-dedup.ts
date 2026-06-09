export const ANALYTICS_EVENT_NAMES = [
  "page_view",
  "product_view",
  "add_to_cart",
  "remove_from_cart",
  "checkout_start",
  "checkout_abandon",
  "order_placed",
  "search",
  "category_view",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

const COUNTABLE_EVENTS = new Set<AnalyticsEventName>([
  "product_view",
  "checkout_start",
  "checkout_abandon",
  "search",
  "category_view",
]);

export function isCountableEvent(eventName: string): eventName is AnalyticsEventName {
  return COUNTABLE_EVENTS.has(eventName as AnalyticsEventName);
}

export function pktBucketDate(date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
}

function normalizeSearchQuery(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 120);
}

export function computeDedupKey(
  eventName: string,
  payload?: Record<string, unknown> | null,
): string | null {
  if (!isCountableEvent(eventName)) return null;

  switch (eventName) {
    case "product_view": {
      const slug = String(payload?.productSlug ?? "").trim();
      return slug ? `product:${slug}` : null;
    }
    case "checkout_start":
      return "checkout_start";
    case "checkout_abandon":
      return "checkout_abandon";
    case "search": {
      const q = normalizeSearchQuery(payload?.query);
      return q ? `search:${q}` : null;
    }
    case "category_view": {
      const cat = String(payload?.category ?? "").trim();
      return cat ? `category:${cat}` : null;
    }
    default:
      return null;
  }
}
