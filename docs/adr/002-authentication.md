# ADR-002: Admin authentication

**Status:** Accepted  
**Date:** 2026-06-04

## Context

Admin CRUD and order mutations must be protected (NFR-4). Storefront is mostly public; COD checkout is guest-only (FR-S7).

## Decision

- **Admin users** table with bcrypt password hashes.
- **JWT access token** (short TTL, e.g. 15m) + **refresh token** (e.g. 7d) issued by `POST /auth/login`.
- Admin Next.js app stores tokens in **httpOnly cookies** (preferred) or memory + refresh flow.
- Middleware on `lagari-fe` `/admin/*` validates session before rendering.
- All `/admin/*` API routes require `Authorization: Bearer` or validated cookie forwarded by BFF if used.
- MVP: single role `admin` (no RBAC matrix).

## Consequences

**Positive:** Stateless API scaling; familiar pattern.

**Negative:** Must implement refresh rotation and secure cookie flags in production.

**Follow-up:** Rate-limit login (NFR-15).
