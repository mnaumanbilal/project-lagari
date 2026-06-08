# Progress — Lagari

## What works

- [x] Next.js 16 storefront + API mode (`NEXT_PUBLIC_USE_API=true`)
- [x] `lagari-be/` catalog, cart, COD checkout, sessions, auth
- [x] Admin sidebar console: dashboard, orders, products CRUD, analytics, reviews
- [x] Admin dark theme, toasts, product form validation + API field mapping (slug 409)
- [x] Batched analytics ingest + admin overview aggregations
- [x] Customer reviews on PDP + admin moderation + Shopify import
- [x] `cancelled` order status + transitions from pending/confirmed
- [x] `npm run build` passes in `lagari-fe` and `lagari-be`

## What's left

### V1 / polish

- [x] Cloudinary upload + URL gallery in admin product form; rich text description editor
- [ ] Live SSE admin feed (FR-D2)
- [ ] Notifications (Slack/SMS)
- [ ] Full Shopify product import (reviews import done)

## Known issues

| Issue | Notes |
|-------|--------|
| sendBeacon | No custom headers — `sessionId` included in batch JSON body |
| CSV import | Simple comma split; complex quoted CSV may need parser upgrade |

## Status

**Phase:** MVP admin + analytics shipped — ready for QA on local stack.

## Session log

| Date | Work |
|------|------|
| 2026-06-05 | Full admin panel, analytics batch pipeline, reviews |
