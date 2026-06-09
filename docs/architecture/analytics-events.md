# Analytics events

Storefront events are buffered client-side and flushed to `POST /analytics/events/batch` about every 5 seconds, with `sendBeacon` on tab close or hide.

## Identity

| ID | Storage | Purpose |
|----|---------|---------|
| **visitor_id** | `localStorage` (`lagari_visitor_id`) | Same person across sessions/tabs until cleared |
| **session_id** | `sessionStorage` (`lagari_session_id`) | Single visit; funnel steps (checkout, cart) |

`POST /sessions` accepts optional `{ visitorId }` and returns `{ id, visitorId, expiresAt }`.

Sessions expire after **30 minutes** idle.

## Transport

| Header / field | Required | Notes |
|----------------|----------|-------|
| `X-Session-Id` | Yes (fetch) | UUID from `POST /sessions` |
| `sessionId` in body | Fallback | Used by `sendBeacon` |
| `visitorId` in body | Optional | Visitor UUID for beacon batches |
| `events` | Yes | 1–25 items per request |

Rate limit: **12 batches/minute** per session.

## Deduplication

**Client** (`lagari-fe/lib/analytics/dedupe.ts`):

- `product_view` — once per product per PKT calendar day (sessionStorage)
- `checkout_start` / `checkout_abandon` — once per session
- `search` — once per normalized query per session
- `category_view` — once per category per session

**Server** (`analytics_event_fingerprints`):

- Countable events: `product_view`, `checkout_start`, `checkout_abandon`, `search`, `category_view`
- Unique key: `(session_id, event_name, dedup_key, bucket_date)` where `bucket_date` is PKT
- Event row inserted only when fingerprint insert succeeds

## Event catalog

| `event_name` | When fired | `payload` |
|--------------|------------|-----------|
| `page_view` | Pathname change (storefront) | `{ path }` — 2s debounce |
| `product_view` | PDP mount (deduped) | `{ productSlug }` |
| `add_to_cart` | Successful cart add | `{ productSlug, variantId, qty }` |
| `remove_from_cart` | Item removed from cart | `{ variantId, productSlug? }` |
| `checkout_start` | Checkout with items (once/session) | `{ itemCount }` |
| `checkout_abandon` | Leave checkout without order (once/session) | `{ itemCount }` |
| `order_placed` | COD order success | `{ orderId }` |
| `search` | Shop debounced search | `{ query }` |
| `category_view` | Shop category filter (not `all`) | `{ category }` |

## Admin aggregations

`GET /admin/analytics/overview?days=7|30`:

### Visitors
- **uniqueVisitors** — distinct `visitor_id` with activity in range
- **newVisitors** — `analytics_visitors.first_seen_at` in range
- **returningVisitors** — unique − new
- **activeSessions** — sessions active in last 30 minutes

### Products (`topProducts`)
- **uniqueViewers** — `COUNT(DISTINCT visitor_id)` per slug
- **totalViews** — `COUNT(*)` product_view events
- **addToCartSessions** — distinct sessions per slug
- Enriched with `productId`, `productTitle` via join on `products.slug`

### Funnel (session-scoped)
- **viewToCartRate**, **cartToCheckoutRate**, **checkoutConversionRate**, **cartAbandonmentRate**, **overallConversionRate**
- **ordersPlacedInRange** — ground truth from `orders` table

### Discovery
- **topSearches**, **categoryInterest**

## Frontend modules

- `lagari-fe/lib/analytics/event-buffer.ts` — queue + flush
- `lagari-fe/lib/analytics/dedupe.ts` — client dedupe guards
- `lagari-fe/lib/analytics/analytics-provider.tsx` — session bind + `page_view`
- `lagari-fe/lib/session/session-context.tsx` — visitor + session lifecycle
