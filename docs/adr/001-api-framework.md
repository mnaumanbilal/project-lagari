# ADR-001: API framework

**Status:** Accepted  
**Date:** 2026-06-04

## Context

Lagari needs a decoupled backend for COD orders, JWT admin, Redis sessions, PostgreSQL catalog, and future SSE/notifications. Options: Express, NestJS, or Next.js API routes only.

## Decision

Use **Node.js + Express + TypeScript** in `lagari-be/` with:

- **Zod** for request/response validation
- **node-pg-migrate** for SQL migrations (simple, fits relational schema)
- Module folders: `catalog`, `cart`, `orders`, `sessions`, `analytics`, `auth`

NestJS is deferred. Next.js is **not** the primary backend.

## Consequences

**Positive:** Matches project document §2; predictable Redis connections on hobby container; clear security boundary (Vercel FE has no DB credentials).

**Negative:** Two deployables to manage; need CORS + shared types discipline.

**Follow-up:** OpenAPI in `docs/architecture/openapi-mvp.yaml` is contract for FE.
