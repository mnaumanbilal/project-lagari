# ADR-005: Admin UI hosting

**Status:** Accepted  
**Date:** 2026-06-04

## Context

Admin needs catalog CRUD, orders, metrics. Options: same Next app vs separate admin app vs separate domain.

## Decision

**Single Next.js application** (`lagari-fe/`) with App Router groups:

- `(storefront)/` — public routes
- `(admin)/admin/` — protected admin routes

Shared Tailwind tokens; admin uses a restrained “control room” variant of the design system (denser, less cinematic).

Optional later: deploy admin to `admin.lagari.pk` via Vercel multi-project — same codebase, different env.

## Consequences

**Positive:** One Vercel project ($0); faster MVP.

**Negative:** Admin bundle shares dependency graph with storefront — use route-level code splitting.
