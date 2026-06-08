# Analytics events (MVP)

Storefront events are buffered client-side and flushed to `POST /analytics/events/batch` about every 5 seconds, with `sendBeacon` on tab close or hide.

## Transport

| Header / field | Required | Notes |
|----------------|----------|-------|
| `X-Session-Id` | Yes (fetch) | UUID from `POST /sessions` |
| `sessionId` in body | Fallback | Used by `sendBeacon` when custom headers are unavailable |
| `events` | Yes | 1–25 items per request |

Server touches the session once per batch (not per event). Rate limit: **12 batches/minute** per session.

## Event catalog

| `event_name` | When fired | `payload` |
|--------------|------------|-----------|
| `page_view` | App Router pathname change (storefront only) | `{ path }` — debounced 2s per path |
| `product_view` | PDP mount | `{ productSlug }` |
| `add_to_cart` | Successful cart add (API mode) | `{ productSlug, variantId, qty }` |
| `checkout_start` | Checkout page with items | `{ itemCount }` |
| `checkout_abandon` | Leave checkout with items, no order | `{ itemCount }` |
| `order_placed` | COD order success | `{ orderId }` |

Optional per-event `clientTs` (ISO string) may be included; server stores `created_at` from DB default.

## Admin aggregations

`GET /admin/analytics/overview?days=7|30` derives:

- **newVisitors** — distinct sessions with `started_at` in range
- **cartDropOffRate** — checkout_start sessions without order_placed / checkout_start
- **cancelledOrders** — `orders.status = cancelled` in range
- **activeSessions** — `ended_at` null and `last_activity_at` within 30 minutes
- **topProductsByViews** — `product_view` grouped by `payload.productSlug`

Dashboard `GET /admin/metrics/summary` uses live **activeSessions** from the same session query.

## Frontend modules

- `lagari-fe/lib/analytics/event-buffer.ts` — queue + flush
- `lagari-fe/lib/analytics/analytics-provider.tsx` — session bind + `page_view`
- Wired from cart, checkout, and PDP tracker components
