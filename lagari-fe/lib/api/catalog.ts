import type {
  CatalogProduct,
  CategoryOption,
  NoteTagOption,
  ProductListResponse,
} from "@/lib/types/catalog";
import { apiFetch } from "./client";

const CATALOG_CACHE = {
  next: { revalidate: 60, tags: ["catalog"] as string[] },
} as const;

export async function fetchCategories(): Promise<CategoryOption[]> {
  return apiFetch<CategoryOption[]>("/catalog/categories", CATALOG_CACHE);
}

export async function fetchNoteTags(): Promise<NoteTagOption[]> {
  return apiFetch<NoteTagOption[]>("/catalog/note-tags", CATALOG_CACHE);
}

export async function fetchProducts(params?: {
  category?: string;
  note?: string;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<ProductListResponse> {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.note) search.set("note", params.note);
  if (params?.q) search.set("q", params.q);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();

  const hasSearch = Boolean(params?.q?.trim());
  return apiFetch<ProductListResponse>(
    `/catalog/products${qs ? `?${qs}` : ""}`,
    hasSearch
      ? { cache: "no-store" }
      : CATALOG_CACHE,
  );
}

export async function fetchProductBySlug(
  slug: string,
): Promise<CatalogProduct | null> {
  try {
    return await apiFetch<CatalogProduct>(`/catalog/products/${slug}`, {
      next: { revalidate: 60, tags: ["catalog", `product-${slug}`] },
    });
  } catch {
    return null;
  }
}

export async function fetchSiteConfig(): Promise<{
  cloudinaryCloudName: string | null;
}> {
  return apiFetch("/catalog/site-config", {
    next: { revalidate: 300 },
  });
}
