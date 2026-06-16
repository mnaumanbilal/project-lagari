# Progress — Lagari

## What works

- [x] Next.js 16 storefront + API mode (`NEXT_PUBLIC_USE_API=true`)
- [x] `lagari-be/` catalog, cart, COD checkout, sessions, auth
- [x] Admin sidebar console: dashboard, orders, products CRUD, analytics, reviews
- [x] Admin dark theme, toasts, product form validation + API field mapping (slug 409)
- [x] Batched analytics ingest + admin overview aggregations
- [x] Customer reviews on PDP + admin moderation + Shopify import
- [x] **Review verification:** Contact-based (phone/email) purchase matching — strict reject on no match; quota (1 review per purchased unit); eligibility endpoint + live PDP badge with field-level error reporting; admin contact chips + expandable linked-order panel
- [x] **Review ratings:** PDP title + shop cards + admin products; accurate SQL aggregates
- [x] **Admin reviews:** filters (date, rating, sort, product), pagination, hotlinks, per-product panel
- [x] **Review analytics:** dashboard pending count, Analytics page section, Reviews stats bar
- [x] Perfume notes (top/heart/base) on admin product form
- [x] Line items link to storefront PDP (admin, emails, cart)
- [x] `cancelled` order status + transitions from pending/confirmed
- [x] `npm run build` passes in `lagari-fe` and `lagari-be`

## What's left

### V1 / polish

- [x] Cloudinary upload + URL gallery in admin product form; rich text description editor
- [ ] Live SSE admin feed (FR-D2)
- [ ] Notifications (Slack/SMS)
- [ ] Full Shopify product import (reviews import done)
- [ ] JSON-LD aggregateRating on PDP

## Known issues

| Issue | Notes |
|-------|--------|
| sendBeacon | No custom headers — `sessionId` included in batch JSON body |
| CSV import | Simple comma split; complex quoted CSV may need parser upgrade |
| Admin product list | N+1 `getAdminProduct` calls — acceptable at current catalog size |

## Status

**Phase:** MVP admin + analytics + reviews merchandising shipped — ready for QA.

## Session log

| Date | Work |
|------|------|
| 2026-06-16 | Sprint 6: Admin review linked-order panel (expand/collapse, items table, Go to order); storefront field-level eligibility error reporting |
| 2026-06-16 | Sprint 5: Storefront toast system; field-mapped API errors (`api-errors.ts`); eligibility 200-OK failures now show under the relevant input |
| 2026-06-16 | Sprint 4: Robust review verification — contact normalization, migration, eligibility service+endpoint, PDP form, admin contact chips, handover doc |
| 2026-06-16 | Sprint 3: Error resilience — ErrorBoundary, error.tsx, hydration fix, infinite-loop fix, HTML nesting fix, SSE reconnect cap |
| 2026-06-16 | Sprint 2: Site-wide performance — N+1 fix, Promise.all analytics, DB pool, cache headers, performance indexes, replaceShopUrl, Suspense, loading skeletons |
| 2026-06-16 | Sprint 1: Admin review search (debounced slug+title) and pending/all tabs |
| 2026-06-05 | Full admin panel, analytics batch pipeline, reviews |
| 2026-06-04 | Review ratings surfacing, filters, analytics, perfume notes admin fields |
