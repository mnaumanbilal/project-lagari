"use client";

import { Suspense, type ReactNode } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ProductSearchProvider } from "@/lib/context/product-search-context";
import { AnalyticsProvider } from "@/lib/analytics/analytics-provider";
import { CartProvider } from "@/lib/cart/cart-context";
import { SessionProvider } from "@/lib/session/session-context";

export function StorefrontProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <SessionProvider>
        <AnalyticsProvider>
          <CartProvider>
            <Suspense fallback={null}>
              <ProductSearchProvider>{children}</ProductSearchProvider>
            </Suspense>
          </CartProvider>
        </AnalyticsProvider>
      </SessionProvider>
    </QueryProvider>
  );
}
