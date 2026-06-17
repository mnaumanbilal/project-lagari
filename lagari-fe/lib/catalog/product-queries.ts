import { listProducts } from "@/lib/catalog";
import type { CatalogProduct } from "@/lib/types/catalog";

export type ProductSearchFilters = {
  category?: string;
  note?: string;
  q?: string;
};

export const SEARCH_DEBOUNCE_MS = 400;

export const catalogQueryKeys = {
  products: (filters: ProductSearchFilters) =>
    ["catalog", "products", filters] as const,
};

/** Client-safe catalog fetch — same source as server pages (no dummy fallback in production). */
export async function fetchCatalogProducts(
  filters: ProductSearchFilters,
): Promise<CatalogProduct[]> {
  const q = filters.q?.trim();
  return listProducts({
    category: filters.category,
    note: filters.note,
    q: q || undefined,
  });
}

/** Client-side typeahead for header (limited results). */
export async function searchCatalogProducts(
  q: string,
  limit = 6,
): Promise<CatalogProduct[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const items = await fetchCatalogProducts({ q: trimmed });
  return items.slice(0, limit);
}
