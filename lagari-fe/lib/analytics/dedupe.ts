const PRODUCT_VIEW_KEY = "lagari_pv_dedup";
const SESSION_FLAGS_KEY = "lagari_analytics_flags";
const SEARCH_DEDUP_KEY = "lagari_search_dedup";

function pktDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
}

function readJsonMap(key: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeJsonMap(key: string, map: Record<string, string>) {
  sessionStorage.setItem(key, JSON.stringify(map));
}

function readFlags(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(SESSION_FLAGS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function setFlag(name: string) {
  const flags = readFlags();
  flags[name] = true;
  sessionStorage.setItem(SESSION_FLAGS_KEY, JSON.stringify(flags));
}

function hasFlag(name: string): boolean {
  return Boolean(readFlags()[name]);
}

/** Once per visitor per product per PKT calendar day. */
export function shouldTrackProductView(productSlug: string): boolean {
  const day = pktDateString();
  const map = readJsonMap(PRODUCT_VIEW_KEY);
  const key = `${day}:${productSlug}`;
  if (map[key]) return false;
  map[key] = "1";
  writeJsonMap(PRODUCT_VIEW_KEY, map);
  return true;
}

export function shouldTrackCheckoutStart(): boolean {
  if (hasFlag("checkout_start")) return false;
  setFlag("checkout_start");
  return true;
}

export function shouldTrackCheckoutAbandon(): boolean {
  if (!hasFlag("checkout_start") || hasFlag("order_placed")) return false;
  if (hasFlag("checkout_abandon")) return false;
  setFlag("checkout_abandon");
  return true;
}

export function markOrderPlaced() {
  setFlag("order_placed");
}

export function shouldTrackCategoryView(category: string): boolean {
  const key = `category:${category}`;
  if (hasFlag(key)) return false;
  setFlag(key);
  return true;
}

export function shouldTrackSearch(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return false;
  const map = readJsonMap(SEARCH_DEDUP_KEY);
  if (map[normalized]) return false;
  map[normalized] = "1";
  writeJsonMap(SEARCH_DEDUP_KEY, map);
  return true;
}

/** Once per variant per PKT calendar day. */
export function shouldTrackAddToCart(variantId: string): boolean {
  const day = pktDateString();
  const map = readJsonMap(PRODUCT_VIEW_KEY);
  const key = `cart:${day}:${variantId}`;
  if (map[key]) return false;
  map[key] = "1";
  writeJsonMap(PRODUCT_VIEW_KEY, map);
  return true;
}

export function shouldTrackCartDrawerOpen(): boolean {
  const key = "cart_drawer_open";
  if (hasFlag(key)) return false;
  setFlag(key);
  return true;
}

export function shouldTrackVariantSelect(productSlug: string, variantId: string): boolean {
  const key = `variant:${productSlug}:${variantId}`;
  if (hasFlag(key)) return false;
  setFlag(key);
  return true;
}

export function shouldTrackNoteFilter(note: string): boolean {
  const key = `note:${note}`;
  if (hasFlag(key)) return false;
  setFlag(key);
  return true;
}
