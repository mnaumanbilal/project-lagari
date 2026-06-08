# Lagari — Implementation roadmap

Aligned with Project Document §9 and [PLATFORM-PLAN.md](./PLATFORM-PLAN.md).

## Phase summary

| Phase | Name | Status | Exit criteria |
|-------|------|--------|---------------|
| P0 | Requirements ingest | Done | FR/NFR, gap matrix, memory-bank |
| P1 | Planning artifacts | Done | ADRs, ERD, OpenAPI, design doc, plan in repo |
| P1.5 | User approval | Done | User approved implementation start |
| P2 | Database | **In progress** | `lagari-be` scaffolded; run migrate after `.env` DB creds |
| P3 | API | **In progress** | MVP routes implemented; verify after DB up |
| P4 | Storefront | Blocked | Catalog, PDP, cart, COD, OG tags |
| P5 | Admin UI | Blocked | Login, CRUD, orders, timeline |
| P6 | Launch prep | Blocked | Shopify import, redirects, rate limits |
| V1 | Experience + ops | Blocked | GSAP, AI, feed, notifications |

## P2 — Database

- Scaffold `lagari-be/` (Express shell only)
- Implement schema per [erd.md](../architecture/erd.md)
- Seed: categories (Men/Women/Unisex/All), note tags, sample products

## P3 — API

- Contract: [openapi-mvp.yaml](../architecture/openapi-mvp.yaml)
- Redis sessions/carts (ADR-006)
- JWT admin auth (ADR-002)

## P4 — Storefront (`lagari-fe/`)

- Follow [lagari-visual-direction.md](../design/lagari-visual-direction.md)
- Route groups: `(storefront)`, minimal `(admin)` shell until P5

## P5 — Admin

- `/admin/*` protected routes
- Product CRUD, order management, metrics summary

## P6 — Launch

- FR-M1 Shopify import, FR-M2 redirects
- NFR-15 rate limits, NFR-8 logging

## V1

- FR-S1–S3, FR-A1–A2, FR-D2, FR-D4, FR-N1–N4, FR-C1–C2, FR-O2
