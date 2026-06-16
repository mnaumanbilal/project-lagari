export type ShopUrlFilters = {
  category: string;
  note?: string;
  q: string;
};

export function parseShopFilters(search: string): ShopUrlFilters {
  const params = new URLSearchParams(search);
  return {
    category: params.get("category") ?? "all",
    note: params.get("note") ?? undefined,
    q: params.get("q") ?? "",
  };
}

export function buildShopPath(filters: ShopUrlFilters): string {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== "all") {
    params.set("category", filters.category);
  }
  if (filters.note) params.set("note", filters.note);
  const q = filters.q.trim();
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

/** Update shop URL without triggering a Next.js RSC navigation. */
export function replaceShopUrl(filters: ShopUrlFilters): void {
  if (typeof window === "undefined") return;
  window.history.replaceState(window.history.state, "", buildShopPath(filters));
}
