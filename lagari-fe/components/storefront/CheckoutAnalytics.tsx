"use client";

import { useEffect, useRef } from "react";
import {
  trackCheckoutAbandon,
  trackCheckoutStart,
} from "@/lib/analytics/event-buffer";
import { wasCheckoutPlaced } from "@/lib/analytics/checkout-placed";
import { useCart } from "@/lib/cart/cart-context";

export function CheckoutAnalytics() {
  const { itemCount, ready } = useCart();
  const started = useRef(false);

  useEffect(() => {
    if (!ready || itemCount < 1) return;

    if (!started.current) {
      trackCheckoutStart(itemCount);
      started.current = true;
    }

    return () => {
      if (!wasCheckoutPlaced() && itemCount > 0) {
        trackCheckoutAbandon(itemCount);
      }
    };
  }, [ready, itemCount]);

  return null;
}
