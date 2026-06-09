"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { bindAnalyticsSession, trackPageView } from "./event-buffer";
import { useSession } from "@/lib/session/session-context";

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { sessionId, ready } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    bindAnalyticsSession(sessionId);
  }, [sessionId, ready]);

  useEffect(() => {
    if (!ready || !sessionId || !pathname) return;
    if (pathname.startsWith("/admin-panel-route")) return;
    trackPageView(pathname);
  }, [pathname, sessionId, ready]);

  return <>{children}</>;
}
