import { USE_API, USE_DUMMY_CATALOG } from "@/lib/api/config";
import {
  fetchCategories,
  fetchNoteTags,
  fetchProductBySlug,
  fetchProducts,
} from "@/lib/api/catalog";
import {
  CATEGORY_LABELS,
  DUMMY_NOTE_TAGS,
  DUMMY_PRODUCTS,
  fromListPricing,
  getProductBySlug as dummyGetBySlug,
  listProducts as dummyList,
} from "@/lib/data/dummy-products";
import type {
  CatalogProduct,
  CategoryOption,
  NoteTagOption,
} from "@/lib/types/catalog";

export { CATEGORY_LABELS };
export type { CatalogProduct, CategoryOption, NoteTagOption };
export type { NoteTag, ProductCategory } from "@/lib/data/dummy-products";

function dummyCatalogProducts(filters?: {
  category?: string;
  note?: string;
  q?: string;
}): CatalogProduct[] {
  return dummyList(filters).map((p) => ({
    ...p,
    designerInspiration: p.designerInspiration,
    heroImageUrl: p.heroImageUrl,
    hoverImageUrl: p.hoverImageUrl,
    variants: p.variants.map((v) => ({
      ...v,
      inStock: v.stock > 0,
    })),
    ...fromListPricing(p),
  }));
}

function catalogFallback(filters?: {
  category?: string;
  note?: string;
  q?: string;
}): CatalogProduct[] {
  if (USE_DUMMY_CATALOG) return dummyCatalogProducts(filters);
  return [];
}

export async function listCategories(): Promise<CategoryOption[]> {
  if (USE_API) {
    try {
      return await fetchCategories();
    } catch {
      /* fall through */
    }
  }
  if (USE_DUMMY_CATALOG) {
    return Object.entries(CATEGORY_LABELS).map(([slug, name]) => ({
      slug,
      name,
    }));
  }
  return [];
}

export async function listNoteTags(): Promise<NoteTagOption[]> {
  if (USE_API) {
    try {
      return await fetchNoteTags();
    } catch {
      /* fall through */
    }
  }
  if (USE_DUMMY_CATALOG) {
    return DUMMY_NOTE_TAGS.map(({ slug, name }) => ({ slug, name }));
  }
  return [];
}

export async function listProducts(filters?: {
  category?: string;
  note?: string;
  q?: string;
}): Promise<CatalogProduct[]> {
  if (USE_API) {
    try {
      const { items } = await fetchProducts(filters);
      return items;
    } catch {
      /* fall through to dummy */
    }
  }
  return catalogFallback(filters);
}

function dummyProductBySlug(slug: string): CatalogProduct | null {
  const p = dummyGetBySlug(slug);
  if (!p) return null;
  return {
    ...p,
    ...fromListPricing(p),
  };
}

export async function getProductBySlug(
  slug: string,
): Promise<CatalogProduct | null> {
  if (USE_API) {
    try {
      const product = await fetchProductBySlug(slug);
      if (product) return product;
    } catch {
      /* fall through */
    }
  }
  if (USE_DUMMY_CATALOG) return dummyProductBySlug(slug);
  return null;
}

export async function getAllProductSlugs(): Promise<string[]> {
  if (USE_API) {
    try {
      const { items } = await fetchProducts({ limit: 48 });
      return items.map((p) => p.slug);
    } catch {
      /* fall through */
    }
  }
  if (USE_DUMMY_CATALOG) return DUMMY_PRODUCTS.map((p) => p.slug);
  return [];
}

export async function getFeaturedAndRest(): Promise<{
  featured: CatalogProduct;
  rest: CatalogProduct[];
}> {
  const all = await listProducts();
  const featured =
    all.find((p) => p.slug === "velocity") ??
    all.find((p) => p.slug === "desert-noir") ??
    all[0] ??
    null;
  if (!featured) {
    throw new Error("No products available");
  }
  const rest = all.filter((p) => p.slug !== featured.slug).slice(0, 3);
  return { featured, rest };
}
