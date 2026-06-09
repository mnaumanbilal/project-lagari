"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [query, setQueryState] = useState(urlQuery);
  const debouncedQ = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const lastCommittedQ = useRef(urlQuery);

  useEffect(() => {
    if (urlQuery === lastCommittedQ.current) return;
    lastCommittedQ.current = urlQuery;
    setQueryState(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (pathname !== "/shop") return;
    if (debouncedQ === lastCommittedQ.current) return;

    lastCommittedQ.current = debouncedQ;

    const params = new URLSearchParams(window.location.search);
    if (debouncedQ) params.set("q", debouncedQ);
    else params.delete("q");

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [debouncedQ, pathname, router]);

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
