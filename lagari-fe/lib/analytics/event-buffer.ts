"use client";

import { API_BASE_URL, USE_API } from "@/lib/api/config";
import { ANALYTICS_EVENTS } from "@/lib/analytics/event-names";
import {
  markOrderPlaced,
  shouldTrackCategoryView,
  shouldTrackCheckoutAbandon,
  shouldTrackCheckoutStart,
  shouldTrackProductView,
  shouldTrackSearch,
} from "@/lib/analytics/dedupe";

export type AnalyticsEventInput = {
  eventName: string;
  payload?: Record<string, unknown>;
  clientTs?: string;
};

const FLUSH_MS = 5000;
const MAX_BATCH = 25;
const PAGE_VIEW_DEBOUNCE_MS = 2000;

let queue: AnalyticsEventInput[] = [];
let sessionId: string | null = null;
let visitorId: string | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let lastPageView: { path: string; at: number } | null = null;

function canSend() {
  return USE_API && sessionId && queue.length > 0;
}

async function postBatch(events: AnalyticsEventInput[], keepalive = false) {
  if (!sessionId || !USE_API) return;
  const body = JSON.stringify({ events, sessionId, visitorId: visitorId ?? undefined });
  const url = `${API_BASE_URL}/analytics/events/batch`;

  if (keepalive && typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": sessionId,
    },
    body,
    keepalive,
  });
}

export function flushAnalytics(keepalive = false) {
  if (!canSend()) return;
  const batch = queue.splice(0, MAX_BATCH);
  void postBatch(batch, keepalive).catch(() => {
    queue = [...batch, ...queue].slice(0, MAX_BATCH * 2);
  });
}

export function trackEvent(event: AnalyticsEventInput) {
  if (!USE_API || !sessionId) return;

  if (event.eventName === ANALYTICS_EVENTS.PAGE_VIEW) {
    const path = String(event.payload?.path ?? "");
    const now = Date.now();
    if (
      lastPageView &&
      lastPageView.path === path &&
      now - lastPageView.at < PAGE_VIEW_DEBOUNCE_MS
    ) {
      return;
    }
    lastPageView = { path, at: now };
  }

  queue.push({
    ...event,
    clientTs: event.clientTs ?? new Date().toISOString(),
  });

  if (queue.length >= MAX_BATCH) flushAnalytics();
}

export function bindAnalyticsSession(id: string | null, visitor: string | null = null) {
  sessionId = id;
  visitorId = visitor;
  if (!id) {
    if (flushTimer) clearInterval(flushTimer);
    flushTimer = null;
    return;
  }
  if (!flushTimer && typeof window !== "undefined") {
    flushTimer = setInterval(() => flushAnalytics(), FLUSH_MS);
    const onLeave = () => flushAnalytics(true);
    window.addEventListener("beforeunload", onLeave);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onLeave();
    });
  }
}

export function trackPageView(path: string) {
  trackEvent({ eventName: ANALYTICS_EVENTS.PAGE_VIEW, payload: { path } });
}

export function trackProductView(productSlug: string) {
  if (!shouldTrackProductView(productSlug)) return;
  trackEvent({
    eventName: ANALYTICS_EVENTS.PRODUCT_VIEW,
    payload: { productSlug },
  });
}

export function trackAddToCart(payload: {
  productSlug: string;
  variantId: string;
  qty: number;
}) {
  trackEvent({ eventName: ANALYTICS_EVENTS.ADD_TO_CART, payload });
}

export function trackRemoveFromCart(payload: {
  variantId: string;
  productSlug?: string;
}) {
  trackEvent({ eventName: ANALYTICS_EVENTS.REMOVE_FROM_CART, payload });
}

export function trackCheckoutStart(itemCount: number) {
  if (!shouldTrackCheckoutStart()) return;
  trackEvent({
    eventName: ANALYTICS_EVENTS.CHECKOUT_START,
    payload: { itemCount },
  });
}

export function trackCheckoutAbandon(itemCount: number) {
  if (!shouldTrackCheckoutAbandon()) return;
  trackEvent({
    eventName: ANALYTICS_EVENTS.CHECKOUT_ABANDON,
    payload: { itemCount },
  });
}

export function trackOrderPlaced(orderId: string) {
  markOrderPlaced();
  trackEvent({ eventName: ANALYTICS_EVENTS.ORDER_PLACED, payload: { orderId } });
}

export function trackSearch(query: string) {
  if (!shouldTrackSearch(query)) return;
  trackEvent({ eventName: ANALYTICS_EVENTS.SEARCH, payload: { query: query.trim() } });
}

export function trackCategoryView(category: string) {
  if (!shouldTrackCategoryView(category)) return;
  trackEvent({ eventName: ANALYTICS_EVENTS.CATEGORY_VIEW, payload: { category } });
}
