"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  trackCheckoutAbandon,
  trackCheckoutStart,
} from "@/lib/analytics/event-buffer";
import { wasCheckoutPlaced } from "@/lib/analytics/checkout-placed";
import { useCart } from "@/lib/cart/cart-context";

export function CheckoutAnalytics() {
  const pathname = usePathname();
  const { itemCount, ready } = useCart();
  const started = useRef(false);
  const wasOnCheckout = useRef(false);
  const lastItemCount = useRef(0);

  const onCheckout = pathname === "/checkout";

  useEffect(() => {
    if (ready) lastItemCount.current = itemCount;
  }, [itemCount, ready]);

  useEffect(() => {
    if (!ready) return;

    if (onCheckout && itemCount >= 1 && !started.current) {
      trackCheckoutStart(itemCount);
      started.current = true;
      wasOnCheckout.current = true;
      return;
    }

    if (wasOnCheckout.current && !onCheckout && !wasCheckoutPlaced()) {
      trackCheckoutAbandon(lastItemCount.current);
      wasOnCheckout.current = false;
    }
  }, [onCheckout, ready, itemCount]);

  useEffect(() => {
    if (!ready || !onCheckout) return;

    function handleLeave() {
      if (!wasCheckoutPlaced() && lastItemCount.current > 0) {
        trackCheckoutAbandon(lastItemCount.current);
      }
    }

    window.addEventListener("beforeunload", handleLeave);
    return () => window.removeEventListener("beforeunload", handleLeave);
  }, [onCheckout, ready]);

  return null;
}
