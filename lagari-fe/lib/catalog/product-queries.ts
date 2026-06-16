import { USE_API } from "@/lib/api/config";
import { fetchProducts } from "@/lib/api/catalog";
import {
  DUMMY_PRODUCTS,
  fromListPricing,
  listProducts as dummyList,
} from "@/lib/data/dummy-products";
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

export async function fetchCatalogProducts(
  filters: ProductSearchFilters,
): Promise<CatalogProduct[]> {
  const q = filters.q?.trim();

  if (USE_API) {
    const { items } = await fetchProducts({
      category: filters.category,
      note: filters.note,
      q: q || undefined,
    });
    return items;
  }

  return dummyList({
    category: filters.category,
    note: filters.note,
    q: q || undefined,
  }).map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    designerInspiration: p.designerInspiration,
    heroImageUrl: p.heroImageUrl,
    hoverImageUrl: p.hoverImageUrl,
    categories: p.categories,
    noteTags: p.noteTags,
    variants: p.variants.map((v) => ({
      ...v,
      inStock: v.stock > 0,
    })),
    ...fromListPricing(p),
  }));
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
