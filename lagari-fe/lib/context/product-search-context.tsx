"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { replaceShopUrl, parseShopFilters } from "@/lib/catalog/shop-url";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { SEARCH_DEBOUNCE_MS } from "@/lib/catalog/product-queries";

type ProductSearchContextValue = {
  query: string;
  setQuery: (value: string) => void;
  debouncedQ: string;
  isDebouncing: boolean;
};

const ProductSearchContext = createContext<ProductSearchContextValue | null>(
  null,
);

export function ProductSearchProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = pathname === "/shop" ? (searchParams.get("q") ?? "") : "";

  const [query, setQueryState] = useState(urlQuery);
  const debouncedQ = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const lastCommittedQ = useRef(urlQuery);

  useEffect(() => {
    if (pathname !== "/shop") return;
    if (urlQuery === lastCommittedQ.current) return;
    lastCommittedQ.current = urlQuery;
    setQueryState(urlQuery);
  }, [pathname, urlQuery]);

  useEffect(() => {
    const onPopState = () => {
      if (pathname !== "/shop") return;
      const fromUrl = parseShopFilters(window.location.search).q;
      lastCommittedQ.current = fromUrl;
      setQueryState(fromUrl);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/shop") return;
    if (debouncedQ === lastCommittedQ.current) return;

    lastCommittedQ.current = debouncedQ;
    const current = parseShopFilters(window.location.search);
    replaceShopUrl({ ...current, q: debouncedQ });
  }, [debouncedQ, pathname]);

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
  }, []);

  const isDebouncing = query.trim() !== debouncedQ;

  return (
    <ProductSearchContext.Provider
      value={{ query, setQuery, debouncedQ, isDebouncing }}
    >
      {children}
    </ProductSearchContext.Provider>
  );
}

export function useProductSearchInput() {
  const context = useContext(ProductSearchContext);
  if (!context) {
    throw new Error(
      "useProductSearchInput must be used within ProductSearchProvider",
    );
  }
  return context;
}

export function useOptionalProductSearchInput() {
  return useContext(ProductSearchContext);
}
