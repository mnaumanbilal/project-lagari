# Active Context — Lagari

## Current focus

**Error handling & resilience** — unified FE error display (field/section/form/toast), structured `code`/`field` API contract, BE error taxonomy + retry + pino logging + crash guards. Source of truth: `docs/architecture/error-resilience.md`.

## Recent changes

- **Error resilience (Sprint 7):** Review eligibility returns `code`+`field`; FE maps structurally so `limit_reached`/submit `409` show under the contact section (was silent). Toast wired into review submit; debounce race guard; 429/network mapped. Admin optimistic mutations roll back in `onError`. BE: `error-taxonomy.ts`, `retry.ts` (transient-only), pino `logger.ts`, `request-id.ts`, `AppError` `code`/`field`, crash guards + graceful shutdown. Vitest added to both packages.

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
