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
  "cart_drawer_open",
  "variant_select",
  "note_filter_apply",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

const COUNTABLE_EVENTS = new Set<AnalyticsEventName>([
  "product_view",
  "add_to_cart",
  "checkout_start",
  "checkout_abandon",
  "search",
  "category_view",
  "cart_drawer_open",
  "variant_select",
  "note_filter_apply",
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
    case "add_to_cart": {
      const variantId = String(payload?.variantId ?? "").trim();
      return variantId ? `cart:${variantId}` : null;
    }
    case "cart_drawer_open":
      return "cart_drawer_open";
    case "variant_select": {
      const variantId = String(payload?.variantId ?? "").trim();
      const slug = String(payload?.productSlug ?? "").trim();
      return variantId && slug ? `variant:${slug}:${variantId}` : null;
    }
    case "note_filter_apply": {
      const note = String(payload?.note ?? "").trim();
      return note ? `note:${note}` : null;
    }
    default:
      return null;
  }
}
