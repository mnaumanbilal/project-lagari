"use client";

import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ProductSearchProvider } from "@/lib/context/product-search-context";
import { AnalyticsProvider } from "@/lib/analytics/analytics-provider";
import { CartProvider } from "@/lib/cart/cart-context";
import { SessionProvider } from "@/lib/session/session-context";
import { StorefrontToastProvider } from "@/lib/storefront/toast-context";

export function StorefrontProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary scope="storefront">
      <QueryProvider>
        <SessionProvider>
          <AnalyticsProvider>
            <StorefrontToastProvider>
              <CartProvider>
                <Suspense fallback={null}>
                  <ProductSearchProvider>{children}</ProductSearchProvider>
                </Suspense>
              </CartProvider>
            </StorefrontToastProvider>
          </AnalyticsProvider>
        </SessionProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
