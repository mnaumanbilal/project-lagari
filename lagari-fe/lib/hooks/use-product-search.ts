"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  SEARCH_DEBOUNCE_MS,
  catalogQueryKeys,
  fetchCatalogProducts,
  type ProductSearchFilters,
} from "@/lib/catalog/product-queries";
import type { CatalogProduct } from "@/lib/types/catalog";

function filtersKey(filters: ProductSearchFilters) {
  return JSON.stringify({
    category: filters.category ?? "all",
    note: filters.note ?? "",
    q: filters.q?.trim() ?? "",
  });
}

type Options = {
  debounceMs?: number;
  initialData?: CatalogProduct[];
  initialFilters?: ProductSearchFilters;
};

export function useProductSearch(
  filters: ProductSearchFilters,
  options?: Options,
) {
  const debounceMs = options?.debounceMs ?? SEARCH_DEBOUNCE_MS;
  const trimmedQ = filters.q?.trim() ?? "";
  const debouncedQ = useDebouncedValue(trimmedQ, debounceMs);

  const debouncedFilters: ProductSearchFilters = {
    category: filters.category,
    note: filters.note,
    q: debouncedQ || undefined,
  };

  const canUseInitial =
    options?.initialData &&
    options?.initialFilters &&
    filtersKey(debouncedFilters) === filtersKey(options.initialFilters);

  const query = useQuery({
    queryKey: catalogQueryKeys.products(debouncedFilters),
    queryFn: () => fetchCatalogProducts(debouncedFilters),
    initialData: canUseInitial ? options.initialData : undefined,
    placeholderData: (previous) => previous,
    staleTime: 60_000,
  });

  const isDebouncing = trimmedQ !== debouncedQ;

  return {
    ...query,
    debouncedQ,
    isDebouncing,
    isSearching: isDebouncing || query.isFetching,
  };
}
