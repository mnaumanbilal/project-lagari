"use client";

import { useEffect, useRef } from "react";
import { trackProductView } from "@/lib/analytics/event-buffer";

export function ProductViewTracker({ slug }: { slug: string }) {
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    if (tracked.current === slug) return;
    tracked.current = slug;
    trackProductView(slug);
  }, [slug]);

  return null;
}
