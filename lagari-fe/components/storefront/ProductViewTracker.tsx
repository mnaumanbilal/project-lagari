"use client";

import { useEffect } from "react";
import { trackProductView } from "@/lib/analytics/event-buffer";

export function ProductViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    trackProductView(slug);
  }, [slug]);
  return null;
}
