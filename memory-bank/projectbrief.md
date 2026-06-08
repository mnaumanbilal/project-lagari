# Project Brief — Lagari

## Overview

**Lagari** is a bespoke luxury fragrance e-commerce ecosystem for **www.lagari.pk**, transitioning from Shopify to a custom decoupled architecture. Target audience: premium fragrance consumers in **Pakistan**.

**Canonical spec:** `docs/source/Lagari Project Document.docx`  
**Platform plan:** `docs/plan/PLATFORM-PLAN.md`  
**Requirements:** `docs/requirements/FR.md`, `NFR.md`, `gap-matrix.md`, `glossary.md`

## Repository layout

| Path | Role |
|------|------|
| `docs/source/` | Canonical SRS / blueprint (docx) |
| `docs/plan/` | Living platform plan, roadmap, session log |
| `docs/adr/` | Architecture decision records (ADR-001–009) |
| `docs/architecture/` | ERD, OpenAPI MVP |
| `docs/design/` | Luxury visual direction |
| `docs/requirements/` | FR, NFR, glossary, Shopify gap matrix |
| `lagari-fe/` | Next.js 16 storefront + admin UI |
| `lagari-be/` | Node Express API (planned — not started) |
| `memory-bank/` | AI session context |

## Core goals

1. Replace Shopify with high-performance, ultra-luxury custom storefront (GSAP, Framer, Tailwind).
2. Decouple frontend (Vercel) from backend (Express + PostgreSQL + Redis).
3. Native analytics, COD checkout, AI scent matcher, executive admin — no plugin bloat.
4. Launch infra **< $15/month** (NFR-5).

## Architecture (decided P1)

- **Frontend:** `lagari-fe/` — Next.js 16, single app with `(storefront)` + `(admin)/admin` route groups.
- **Backend:** `lagari-be/` — **Express** + TypeScript + Zod (ADR-001). Not Next.js API as primary backend.

## Scope

- **Phase 1 products:** Fragrance catalog (Men / Women / Unisex / All) with designer inspiration metafields.
- **MVP:** DB + API + catalog + COD orders + admin CRUD + basic analytics sessions.
- **V1:** GSAP experience, AI chatbot, live feed, notifications, risk profile, Cloudinary batch tools.

## Success criteria

- COD order flows end-to-end with admin confirmation pipeline.
- PageSpeed ≥ 90 (NFR-1); SSR social meta on PDPs (NFR-2).
- Spec roadmap §9: Database → API → Frontend → Motion/AI.

## Open decisions

- Pakistan courier + SMS/WhatsApp providers (ADR-008 shortlist).
- Shopify data migration execution date (ADR-007).
