# Lagari — Complete Technical Handover

> **Purpose of this document:** Full torch-pass for any engineer onboarding to the Lagari project.
> Covers architecture, tech stack, design patterns, database schema, migrations, error handling,
> optimisations, and every significant sprint completed to date.

---

## 1. Application overview

| Property | Value |
|----------|-------|
| **App name** | Lagari |
| **Domain** | www.lagari.pk |
| **Type** | Luxury fragrance e-commerce (Pakistan) |
| **Business model** | Cash-on-delivery (COD) only |
| **Status** | MVP shipped — admin, analytics, orders, reviews fully operational |

### Core objectives

- Sell fragrance products directly to Pakistani customers via COD checkout.
- Provide an admin console for order management, product CRUD, analytics, and review moderation.
- Surface authentic customer reviews with verified-purchase enforcement.
- Deliver a luxury, editorial storefront experience.

---

## 2. Repository layout

```
project-lagari/
├── lagari-be/          Express + TypeScript backend API
├── lagari-fe/          Next.js 16 full-stack frontend
├── docs/
│   ├── adr/            Architecture decision records (ADR-001 … ADR-009)
│   ├── architecture/   ERD, OpenAPI contract, admin UX, notifications
│   ├── design/         Visual direction
│   ├── plan/           Platform plan, roadmap, session log
│   └── requirements/   FR, NFR, gap matrix, glossary
└── memory-bank/        Living project memory (read at session start)
```

---

## 3. Tech stack

### Backend — `lagari-be/`

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Express 4 + TypeScript |
| ORM | Sequelize 6 (PostgreSQL) |
| Validation | Zod |
| Auth | JWT (access 15m / refresh 7d), `bcrypt` |
| Cache / Sessions | Redis (Upstash) — `ioredis` |
| Email | Nodemailer (SMTP / Gmail app password) |
| Media | Cloudinary REST API |
| Notifications | SMS (Twilio), Slack webhook, SSE (admin feed) |
| Real-time | Server-Sent Events (`/admin/notifications/stream`) |

### Frontend — `lagari-fe/`

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| React | React 19 |
| Styling | Tailwind CSS 4 with custom design tokens |
| Data fetching | React Query (TanStack Query) |
| Auth | JWT stored in `localStorage`; token refresh via `/auth/refresh` |
| State | React Context (session, cart, notifications) |
| Routing | App Router — `(storefront)` and `admin-panel-route/(console)` groups |

---

## 4. Architecture

```
[Browser]
  Storefront (Next.js RSC + client components)
  Admin Console (client-only JWT, React Query)
      |
      | HTTPS
      v
[Vercel Edge CDN]  →  Next.js server (API routes + SSR)
      |
      | HTTP (internal or remote)
      v
[lagari-be — Express API]
      |
      +--→ PostgreSQL (Neon or self-hosted)
      +--→ Redis (Upstash) — cart, sessions
      +--→ Cloudinary — product images
      +--→ OpenRouter LLM — chat assistant
      +--→ SMTP — transactional email
      +--→ Twilio SMS / Slack webhook — notifications
```

### Key ADRs

| ADR | Decision |
|-----|----------|
| 001 | Express + TypeScript + Zod for API (not NestJS) |
| 002 | JWT authentication (not session cookies) |
| 003 | SSE for real-time admin feed (not WebSockets for MVP) |
| 004 | Cloudinary for media |
| 005 | Vercel for admin + storefront hosting |
| 006 | Redis session + cart (30-min idle TTL) |
| 008 | PK-specific notifications (SMS/WhatsApp + Slack) |
| 009 | Monorepo layout (lagari-be + lagari-fe in one repo) |

---

## 5. Database

### Connection

Configured via `DATABASE_URL` (Neon) or individual `DB_*` env vars.
SSL auto-detected from hostname (`neon.tech`) or `?sslmode=require`.
Connection pool: `max=20`, `min=2`, `acquire=30s`, `idle=10s`.

### Core tables

| Table | Purpose |
|-------|---------|
| `products` | Catalogue — slug, title, scent profile, notes, soft-delete |
| `product_variants` | SKU / price / stock per product |
| `product_images` | Cloudinary URLs, sort order, hero flag |
| `categories` | Top-level fragrance categories |
| `note_tags` | Scent notes (top / heart / base) |
| `product_categories` | M:N join |
| `product_note_tags` | M:N join |
| `customers` | `phone` (unique, normalised) + optional `email`, `full_name`, RTO count |
| `orders` | COD pipeline — status machine, totals, shipping |
| `order_items` | Line items with product/variant snapshots (denormalised for history) |
| `order_timeline_events` | Audit log of every status change |
| `product_reviews` | Customer + imported (Shopify) reviews |
| `analytics_visitors` | Fingerprint-based unique visitor IDs |
| `analytics_sessions` | 30-min idle sessions tied to visitors |
| `analytics_events` | Named event stream (page_view, add_to_cart, purchase, …) |
| `analytics_event_fingerprints` | Deduplication store |
| `admin_users` | Admin login (email + bcrypt password) |
| `admin_notifications` | Inbox for order / review / inventory events |
| `customer_push_subscriptions` | Web Push endpoint registrations |
| `url_redirects` | Static redirect table |

### `product_reviews` columns (post Sprint 4 migration)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `product_id` | UUID FK | products |
| `customer_id` | UUID FK nullable | customers — null for Shopify imports |
| `author_name` | varchar | Display name |
| `rating` | int | 1-5 |
| `body` | text | Review text |
| `source` | enum | `customer` \| `shopify` |
| `is_published` | bool | Live on PDP |
| `is_verified_purchase` | bool | Always true for customer reviews (system enforced) |
| `session_id` | UUID nullable | Legacy — kept for backfill; not used for verification |
| `shopify_legacy_id` | varchar nullable | Unique for Shopify imports |
| `contact_phone_normalized` | varchar(20) nullable | Normalised phone at submission (audit) |
| `contact_email_normalized` | varchar(255) nullable | Normalised email at submission (audit) |

---

## 6. Migrations

Located in `lagari-be/src/db/migrations/`. Run with `sequelize-cli`.

| File | Description |
|------|-------------|
| `20260616120000-order-item-product-slug.js` | Adds `product_slug_snapshot` to `order_items` for storefront PDP links |
| `20260617120000-performance-indexes.js` | Adds DB indexes: `analytics_events`, `analytics_sessions`, `orders`, `product_variants`, `order_items`, `products`, `product_categories` |
| `20260618120000-review-customer-verification.js` | Adds `customer_id`, `contact_phone_normalized`, `contact_email_normalized` to `product_reviews`; drops legacy session unique index; adds `product_reviews_customer_product_idx`; backfills `customer_id` from order sessions; adds `orders_customer_status_idx` |

**Run migrations:**
```bash
cd lagari-be
npx sequelize-cli db:migrate
```

---

## 7. Backend patterns

### File layout (`lagari-be/src/`)

```
config/          env.ts, database.ts
controllers/     Request handlers (Zod parse → service call → res.json)
db/
  migrations/    Sequelize-CLI migration files
  models/        index.ts — all Sequelize models + associations
middleware/      errorHandler, auth, catchAsync
routes/          *Route.ts — URL wiring only
services/        Business logic
templates/       Email HTML builders
utils/           Shared helpers
```

### Error handling

All controller functions are wrapped with `catchAsync` — any thrown error propagates to `errorHandler`:

```
ZodError → 400 { error, details, issues }
AppError → statusCode { error: message }
Unhandled → 500 { error: "Internal server error" }
```

Use `throw new AppError(statusCode, message)` for all intentional API errors.

**Review-specific HTTP codes:**
- `404` — product not found
- `409` — review quota reached (purchased N times, already N reviews)
- `422` — purchase could not be verified (no customer, no purchase, ambiguous email)
- `429` — IP rate limit exceeded (5 per minute)

### Contact normalisation (`utils/contact-normalize.ts`)

All customer phone numbers are normalised to domestic `03xxxxxxxxx` format before storage.
This guarantees that `placeCodOrder` and `submitCustomerReview` always write the same phone key,
so review lookups always match.

```
+923111234567  →  03111234567
00923111234567 →  03111234567
0311-123-4567  →  03111234567
```

Email is trimmed and lowercased. Both use `ContactValidationError` for structured field-level errors.

### Review verification flow

```
POST /catalog/products/:slug/reviews
  ↓
normalizeContact(phone, email)        ← throws 422 if both missing/invalid
  ↓
resolveCustomerFromContact()           ← phone has priority; email is fallback
  ↓ (customer found?)
countPurchasedUnits(customer, product) ← SUM(order_items.quantity) across valid orders
  ↓ (units > 0?)
countExistingCustomerReviews()         ← COUNT(*) where customer_id + product_id
  ↓ (existing < purchased?)
ProductReview.create(isPublished:true, isVerifiedPurchase:true)
```

Rules:
- **Phone takes priority** — if provided, always looked up first (unique key in DB).
- **Email fallback** — if multiple customers share an email, reject with 422 (use phone instead).
- **Quota** — `purchased_units − existing_reviews > 0` to allow a new review.
- **Strict rejection** — no anonymous or pending-queue reviews. Must verify or fail.
- **Audit snapshots** — `contact_phone_normalized` and `contact_email_normalized` saved on the review row for admin traceability.

### Eligibility endpoint

```
GET /catalog/products/:slug/reviews/eligibility
  ?contactPhone=03111234567
  &contactEmail=buyer@example.com
```

Returns `ReviewEligibilityResult` — the frontend uses this for a debounced live check before the
user submits, giving immediate feedback without requiring a full form submission.

---

## 8. Frontend patterns

### Route groups

| Group | Path | Auth |
|-------|------|------|
| Storefront | `app/(storefront)/` | Public |
| Admin | `app/admin-panel-route/(console)/` | JWT required |

### Data fetching

- **Storefront:** React Query (`useQuery`) for dynamic data; RSC + `fetch` for static data.
- **Admin:** React Query with `staleTime: 2min`, `refetchOnWindowFocus: false` to reduce noise.
- **Shop filters:** `history.replaceState` (not Next.js router) for category/note chip changes — avoids full navigation and keeps the URL in sync without triggering RSC refetches.

### Eligibility debounce (`ProductReviews.tsx`)

700ms debounce on `contactPhone` / `contactEmail` input → `GET /reviews/eligibility`.
Shows an inline badge: green tick (can submit) or red message (reason).
Prevents hammering the API while the user types.

### Error handling

- `ErrorBoundary` component wraps both storefront and admin provider trees.
- `error.tsx` at `(storefront)` and `admin-panel-route/(console)` for route-level errors.
- `global-error.tsx` at the app root catches top-level crashes.
- `RouteErrorFallback` provides a consistent fallback UI with a "Try again" button.
- All mutation hooks (`use-admin-mutations.ts`) log errors and surface them via `useAdminToast`.

### Optimistic updates

Review publish/unpublish/delete operations patch the React Query cache immediately (`onMutate`) via
`patchReviewCountsInCache`, then call `refetchReviewStats` on `onSettled` to sync with the server.
This keeps the tab counts and stats cards responsive without waiting for round-trips.

### Session & cart

- Session touch throttled to once per 60s (both FE and BE) to reduce DB write load.
- Cart context fetches keyed on `sessionId` (not `sessionReady`) to allow parallel loading.
- Admin JWT checked via `getValidAccessToken()` before SSE reconnect to prevent 401 loops.
- SSE reconnect capped at `MAX_STREAM_RECONNECTS` to avoid infinite retry storms.

---

## 9. Performance optimisations

### Backend

| Area | Optimisation |
|------|-------------|
| Admin products list | Single `Product.findAll` with all includes + batched `getReviewSummariesForProducts` — eliminates N+1 |
| Analytics overview | `Promise.all` for parallel metric queries |
| Metrics summary | `SUM(total_pkr)` SQL directly — no full row scan |
| Catalog endpoints | `Cache-Control: public, max-age=60` (list) / `max-age=300` (taxonomy) |
| Session touch | Min 60s interval between DB writes |
| DB pool | `max=20`, `min=2` — handles concurrent admin + storefront load |
| Indexes | See migration `20260617120000-performance-indexes.js` |

### Frontend

| Area | Optimisation |
|------|-------------|
| Shop page | RSC prefetches taxonomy + initial products; client handles filter changes via React Query |
| Shop filters | `replaceShopUrl` (no Next.js navigation) for chip/search changes |
| Home page | `HomeProductsLoader` wrapped in `<Suspense>` — hero banner renders instantly |
| Admin navigation | `loading.tsx` skeleton; optimistic shell while token refreshes |
| Search debounce | Admin product search: 350ms; review eligibility: 700ms; catalog search: 400ms |
| Review stats | Optimistic cache patches + `statsSyncing` visual indicator |

---

## 10. Sprint log

### Sprint 1 — Admin review search & tabs
- Smart product search (slug OR title) with 350ms debounce in admin reviews.
- Added "All reviews" and "Pending reviews" tabs with live counts.
- URL-synced filters (`?status=`, `?product=`).
- Documented `useDebouncedCommit` pattern to avoid infinite loops.

### Sprint 2 — Site-wide performance
- N+1 fix for admin product list (single query + batch summary).
- `Promise.all` in analytics overview and metrics summary.
- DB connection pool (max 20).
- `Cache-Control` headers on catalog endpoints.
- Performance indexes migration.
- `replaceShopUrl` — client-only URL for shop filter changes.
- Session touch throttling (60s).
- `<Suspense>` on home product loader.
- Admin loading skeletons (`AdminLoading`, `loading.tsx`).

### Sprint 3 — Error resilience
- `ErrorBoundary`, `RouteErrorFallback`, `error.tsx` (storefront + admin), `global-error.tsx`.
- Fixed hydration mismatch in admin layout (`mounted` state guard).
- Fixed infinite loop in `AdminReviewsToolbar` (`useDebouncedCommit` + URL no-op guard).
- Fixed `<div>` inside `<p>` HTML violation (`StarRating` → `span`).
- SSE reconnection capped + token validity check before reconnect.

### Sprint 4 — Review verification system *(current)*
- **Contact normalisation** (`utils/contact-normalize.ts`) — PK phone + email, with `ContactValidationError`.
- **Migration** `20260618120000-review-customer-verification.js` — adds `customer_id`, contact snapshots to `product_reviews`; drops session unique index; adds customer+product index; backfills customer IDs from order sessions.
- **Model update** — `ProductReview` gains `customerId`, `contactPhoneNormalized`, `contactEmailNormalized`; `Customer ↔ ProductReview` association added.
- **Verification service** — `resolveCustomerFromContact` (phone-first), `countPurchasedUnits` (SUM query), `countExistingCustomerReviews`, `checkReviewEligibility`, updated `submitCustomerReview` (strict reject on failure).
- **Eligibility endpoint** — `GET /catalog/products/:slug/reviews/eligibility` for live frontend checks.
- **Order normalisation** — `placeCodOrder` normalises phone + email before `findOrCreate`, ensuring consistent keys.
- **PDP review form** — contact fields (phone OR email, at least one required), hint copy, 700ms debounced eligibility badge, clear per-reason error messages.
- **Admin reviews UI** — contact snapshot chips (phone/email) shown on each review row for traceability.
- **Database fix** — `database.ts` SSL property union type fixed (`"ssl" in env.db`).

---

## 11. Environment variables

### `lagari-be/.env`

```env
DATABASE_URL=         # Neon postgres URL (preferred)
# Or individual vars:
DB_HOST=
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=lagari
DB_LOGGING=false
DB_POOL_MAX=20

JWT_ACCESS_SECRET=    # min 32 chars
JWT_REFRESH_SECRET=   # min 32 chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

REDIS_URL=

CORS_ORIGIN=https://www.lagari.pk
DOMAIN=https://www.lagari.pk

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_APP_PASSWORD=
EMAIL_FROM=Lagari <noreply@lagari.pk>
ADMIN_EMAIL=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SLACK_WEBHOOK_URL=

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:...
```

### `lagari-fe/.env`

```env
NEXT_PUBLIC_API_URL=https://api.lagari.pk   # or http://localhost:4000
NEXT_PUBLIC_USE_API=true
```

---

## 12. Running locally

```bash
# Backend
cd lagari-be
npm install
cp .env.example .env          # fill in DB + JWT secrets
npx sequelize-cli db:migrate
npm run dev                   # ts-node-dev on port 4000

# Frontend
cd lagari-fe
npm install
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL
npm run dev                   # Next.js on port 3000
```

---

## 13. Known issues / backlog

| Item | Notes |
|------|-------|
| `sendBeacon` has no custom headers | `sessionId` sent in JSON body — acceptable for analytics |
| CSV import | Simple comma split — complex quoted CSV may need parser upgrade |
| JSON-LD `aggregateRating` | Not yet added to PDP `<head>` |
| Live SSE admin feed | Partially implemented — reconnect logic in place, max-retries capped |
| Half-star review input | Deferred to v2; averages already display decimals |
| Web Push notifications | Subscription model in place; send logic pending |

---

## 14. Design patterns reference

| Pattern | Where used | Why |
|---------|-----------|-----|
| `catchAsync` | All controllers | Removes try/catch boilerplate; funnels to `errorHandler` |
| `AppError(statusCode, msg)` | Services, controllers | Typed HTTP errors with client-visible messages |
| `normalizeContact` + `ContactValidationError` | Review service, order service | Single normalisation path for phone/email prevents lookup mismatches |
| `resolveCustomerFromContact` (phone-priority) | Review service | Consistent tie-breaking when user provides both |
| `useDebouncedCommit` | Admin reviews toolbar | Stable `onCommit` ref prevents React infinite loops |
| `replaceShopUrl` (no router nav) | Shop filters | Avoids expensive RSC round-trips for filter chip changes |
| Optimistic cache patch | Review mutations | Immediate UI feedback; server sync on `onSettled` |
| RSC → Client boundary | Shop page, home page | Static data from server; dynamic/interactive in client component |
| `mounted` guard | Admin layout | Prevents hydration mismatch from `localStorage` reads |
| `ErrorBoundary` + `error.tsx` | Both app sections | Crash containment — site never goes fully blank |

---

*Last updated: 2026-06-16 — Sprint 4 (Review verification) complete.*
