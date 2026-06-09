"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { trackCategoryView, trackSearch } from "@/lib/analytics/event-buffer";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductSearchInput } from "@/components/storefront/ProductSearchInput";
import { ShopFilters } from "@/components/storefront/ShopFilters";
import { useProductSearchInput } from "@/lib/context/product-search-context";
import { useProductSearch } from "@/lib/hooks/use-product-search";
import type { CatalogProduct, CategoryOption, NoteTagOption } from "@/lib/types/catalog";

type ShopCatalogProps = {
  categories: CategoryOption[];
  noteTags: NoteTagOption[];
  initialCategory: string;
  initialNote?: string;
  initialQuery?: string;
  initialProducts: CatalogProduct[];
};

export function ShopCatalog({
  categories,
  noteTags,
  initialCategory,
  initialNote,
  initialQuery = "",
  initialProducts,
}: ShopCatalogProps) {
  const searchParams = useSearchParams();
  const { query, setQuery, debouncedQ, isDebouncing } = useProductSearchInput();

  const activeCategory = searchParams.get("category") ?? initialCategory;
  const activeNote = searchParams.get("note") ?? initialNote ?? undefined;

  const serverFilters = useMemo(
    () => ({
      category: initialCategory,
      note: initialNote,
      q: initialQuery || undefined,
    }),
    [initialCategory, initialNote, initialQuery],
  );

  const { data: products = initialProducts, isSearching } = useProductSearch(
    {
      category: activeCategory,
      note: activeNote,
      q: query,
    },
    { initialData: initialProducts, initialFilters: serverFilters },
  );

  const title =
    categories.find((c) => c.slug === activeCategory)?.name ?? "All impressions";

  const emptyMessage = debouncedQ
    ? `No impressions match “${debouncedQ}”.`
    : "No impressions match your filters.";

  const showSearching = isSearching || isDebouncing;

  useEffect(() => {
    if (debouncedQ.trim()) {
      trackSearch(debouncedQ);
    }
  }, [debouncedQ]);

  useEffect(() => {
    if (activeCategory && activeCategory !== "all") {
      trackCategoryView(activeCategory);
    }
  }, [activeCategory]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10 max-w-2xl">
        <p className="font-label text-lagari-brass">Shop</p>
        <h1 className="font-display mt-2 text-4xl font-semibold text-lagari-primary sm:text-5xl">
          {debouncedQ ? "Search results" : title}
        </h1>
        <p className="mt-4 text-lagari-muted">
          {showSearching ? (
            "Searching…"
          ) : (
            <>
              {products.length} scent{products.length === 1 ? "" : "s"}
              {debouncedQ ? (
                <>
                  {" "}
                  for &ldquo;{debouncedQ}&rdquo;
                </>
              ) : (
                " from the Lagari collection"
              )}
              .
            </>
          )}
        </p>
      </header>

      <div className="mb-8 max-w-xl">
        <ProductSearchInput
          id="shop-product-search"
          value={query}
          onChange={setQuery}
          isSearching={showSearching}
        />
        {query.trim() && query.trim() !== debouncedQ ? (
          <p className="mt-2 text-xs text-lagari-muted">
            Results update shortly after you pause typing.
          </p>
        ) : null}
      </div>

      <ShopFilters
        categories={categories}
        noteTags={noteTags}
        activeCategory={activeCategory}
        activeNote={activeNote}
        activeQuery={debouncedQ}
      />

      {!showSearching && products.length === 0 ? (
        <p className="py-16 text-center text-lagari-muted">{emptyMessage}</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
