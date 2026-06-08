# ADR-006: Session and cart in Redis

**Status:** Accepted  
**Date:** 2026-06-04

## Context

FR-4 requires 30-minute idle session timeout. Carts must survive navigation without login. NFR-5 requires caching to limit DB reads.

## Decision

**Upstash Redis** keys:

| Key | TTL | Payload |
|-----|-----|---------|
| `session:{uuid}` | 30m sliding on activity | `createdAt`, `lastActivityAt`, `userAgent` hash |
| `cart:{sessionId}` | Same as session | Line items: `variantId`, `qty`, `priceSnapshot` |

- Session ID issued on first visit (`POST /sessions` or Set-Cookie from FE).
- Analytics events reference `sessionId` in PostgreSQL `analytics_events`.
- On checkout, cart persisted to `orders` + `order_items`; cart key deleted.

## Consequences

**Positive:** Fast cart; live metrics can read Redis counters in V1.

**Negative:** Cart loss if Redis evicts — acceptable for MVP; optional PG cart backup in P2 if needed.
