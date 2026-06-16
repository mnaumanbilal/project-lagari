# Active Context — Lagari

## Current focus

**Performance** — faster navigation (shop client filters, admin query batching, DB indexes, session/cart parallelization).

## Recent changes

- **Shop perf:** Filter/search updates URL via `history.replaceState` (no RSC round-trip); products fetched client-side via React Query; search debounce 400ms; shop page caches taxonomy 5min.
- **Admin perf:** `listAdminProducts` single query + batched review summaries (was N+1); metrics/analytics queries parallelized; admin `loading.tsx` skeletons; optimistic admin shell during token refresh; React Query staleTime 2min, no refetch-on-focus.
- **Storefront perf:** Home hero streams before products (`Suspense`); session touch throttled 60s; cart loads in parallel with session validation.
- **BE infra:** Sequelize pool (max 20); catalog `Cache-Control`; performance indexes migration.

## Next steps

1. Run migration `20260617120000-performance-indexes.js` on all envs.
2. Optional: Redis cache for catalog list; dynamic import TipTap / framer-motion.
3. Optional: JSON-LD `aggregateRating` on PDP metadata.

## Default seed admin

- `admin@lagari.pk` / `changeme123`
