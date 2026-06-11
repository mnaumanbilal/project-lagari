"use client";

import { useEffect } from "react";
import { registerPushServiceWorker } from "@/lib/push/customer-push";

/** Registers the push service worker once on the storefront. */
export function PushServiceWorker() {
  useEffect(() => {
    void registerPushServiceWorker();
  }, []);
  return null;
}
