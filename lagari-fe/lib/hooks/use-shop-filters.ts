"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  parseShopFilters,
  replaceShopUrl,
  type ShopUrlFilters,
} from "@/lib/catalog/shop-url";

function readWindowFilters(): ShopUrlFilters {
  if (typeof window === "undefined") {
    return { category: "all", q: "" };
  }
  return parseShopFilters(window.location.search);
}

export function useShopFilters() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ShopUrlFilters>(() => ({
    category: searchParams.get("category") ?? "all",
    note: searchParams.get("note") ?? undefined,
    q: searchParams.get("q") ?? "",
  }));

  useEffect(() => {
    setFilters({
      category: searchParams.get("category") ?? "all",
      note: searchParams.get("note") ?? undefined,
      q: searchParams.get("q") ?? "",
    });
  }, [searchParams]);

  useEffect(() => {
    const onPopState = () => setFilters(readWindowFilters());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const patchFilters = useCallback((patch: Partial<ShopUrlFilters>) => {
    setFilters((prev) => {
      const next: ShopUrlFilters = { ...prev, ...patch };
      replaceShopUrl(next);
      return next;
    });
  }, []);

  return { filters, patchFilters };
}
