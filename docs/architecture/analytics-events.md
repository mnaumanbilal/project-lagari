# Analytics events

Storefront events are buffered client-side and flushed to `POST /analytics/events/batch` about every 5 seconds, with `sendBeacon` on tab close or hide.

**Requires `USE_API=true`** in the frontend environment so events reach the backend.

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
- `add_to_cart` — once per variant per PKT calendar day
- `checkout_start` / `checkout_abandon` — once per session
- `search` — once per normalized query per session
- `category_view` — once per category per session
- `cart_drawer_open` — once per session
- `variant_select` — once per product+variant per session
- `note_filter_apply` — once per note slug per session

**Server** (`analytics_event_fingerprints`):

- Countable events: `product_view`, `add_to_cart`, `checkout_start`, `checkout_abandon`, `search`, `category_view`, `cart_drawer_open`, `variant_select`, `note_filter_apply`
- Unique key: `(session_id, event_name, dedup_key, bucket_date)` where `bucket_date` is PKT
- Event row inserted only when fingerprint insert succeeds

## Event catalog

| `event_name` | When fired | `payload` |
|--------------|------------|-----------|
| `page_view` | Pathname change (storefront) | `{ path }` — 2s debounce |
| `product_view` | PDP mount (deduped) | `{ productSlug }` |
| `add_to_cart` | Successful cart add (deduped per variant/day) | `{ productSlug, variantId, qty }` |
| `remove_from_cart` | Item removed from cart | `{ variantId, productSlug? }` |
| `checkout_start` | Checkout with items (once/session) | `{ itemCount }` |
| `checkout_abandon` | Leave checkout route without order (once/session) | `{ itemCount }` |
| `order_placed` | COD order success | `{ orderId }` |
| `search` | Shop debounced search | `{ query }` |
| `category_view` | Shop category filter (not `all`) | `{ category }` |
| `cart_drawer_open` | Bag drawer opened (once/session) | `{ itemCount }` |
| `variant_select` | PDP size/variant changed | `{ productSlug, variantId }` |
| `note_filter_apply` | Shop note tag filter clicked | `{ note }` |

## Admin aggregations

`GET /admin/analytics/overview` query params:

| Param | Description |
|-------|-------------|
| `preset=this_week` | Monday 00:00 PKT → now |
| `preset=last_7_days` | Rolling 7 calendar days in PKT |
| `preset=this_month` | 1st of month 00:00 PKT → now |
| `preset=this_year` | Jan 1 00:00 PKT → now |
| `preset=last_30_days` | Rolling 30 calendar days in PKT |
| `from` + `to` | Custom range (`YYYY-MM-DD`, PKT boundaries) |
| `days=7\|30` | Legacy; maps to `last_7_days` / `last_30_days` |

### Visitors
- **uniqueVisitors** — distinct `visitor_id` with activity in range
- **newVisitors** — `analytics_visitors.first_seen_at` in range
- **returningVisitors** — unique − new
- **activeSessions** — sessions active in last 30 minutes

### Funnel (nested session rates)
- **viewToCartRate** — sessions with both `product_view` and `add_to_cart` / product view sessions (never exceeds 100%)
- **cartToCheckoutRate** — sessions with both `add_to_cart` and `checkout_start` / add-to-cart sessions
- **checkoutConversionRate** — checkout starts that also have `order_placed`
- **cartDropOffRate** — checkout starts with no `order_placed` (shown in admin UI as **Checkout drop-off**)
- **cartAbandonmentRate** — add-to-cart sessions with no checkout start
- **overallConversionRate** — order placed sessions / unique visitors (capped at 100%)
- **viewThenCartSessions**, **cartThenCheckoutSessions** — nested step counts for UI
- **ordersPlacedInRange** — ground truth from `orders` table
- **dataQualityWarnings** — surfaced when event vs DB order counts diverge

### Products (`topProducts`)
- **uniqueViewers** — `COUNT(DISTINCT visitor_id)` per slug
- **totalViews** — `COUNT(*)` product_view events
- **addToCartSessions** — distinct sessions per slug

### Discovery
- **topSearches**, **categoryInterest**

## Frontend modules

- Buffer: `lagari-fe/lib/analytics/event-buffer.ts`
- Provider: `lagari-fe/lib/analytics/analytics-provider.tsx`
- Checkout abandon: route change in `CheckoutAnalytics.tsx` (not React effect cleanup)
