# ADR-003: Realtime — SSE vs WebSockets

**Status:** Accepted  
**Date:** 2026-06-04

## Context

V1 requires live admin activity feed (FR-D2) and order toasts (FR-N1). MVP needs only polling or simple metrics refresh.

## Decision

- **MVP:** Admin dashboard polls `GET /admin/metrics/summary` every 30–60s; no persistent connection.
- **V1:** **Server-Sent Events (SSE)** on `GET /admin/feed/stream` for activity chronicle.
- Re-evaluate **WebSockets** only if bidirectional admin↔server features exceed SSE comfort.

Express implements SSE on the same Railway/Render process as REST.

## Consequences

**Positive:** Simpler than Socket.io for one-way feeds; works through many proxies.

**Negative:** SSE is one-way; chat typing indicators would need WebSockets later.
