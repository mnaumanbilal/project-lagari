# Tech Context — Lagari

## Stack (from spec + codebase)

| Layer | Spec | Current repo |
|-------|------|--------------|
| Storefront/Admin UI | Next.js, Tailwind, GSAP, Framer Motion | Next **16.2.7**, React 19, Tailwind 4 — GSAP/Framer **not installed** |
| API | Node.js **Express**, REST JSON | `lagari-be/` **planned** (ADR-001) |
| DB | PostgreSQL (Neon/Supabase) | Not started — see `docs/architecture/erd.md` |
| Cache | Redis (Upstash) — sessions, carts, live metrics | Not started (ADR-006) |
| Media | Cloudinary | Not started (ADR-004) |
| AI | OpenRouter | V1 (ADR-001 scope) |
| Realtime | **SSE** MVP; WebSockets optional | ADR-003 |
| Hosting | Vercel (FE), Railway/Render (BE) | — |

## Frontend package

`lagari-fe/` — App Router, no `src/`. Follow `AGENTS.md` for Next.js 16.

```bash
cd lagari-fe
npm install && npm run dev   # :3000
```

## Backend package (planned)

`lagari-be/` — Express, `pg`, `ioredis`, `jsonwebtoken`, `zod`, `pino`, `helmet`, `cors`.

## Dependencies to add (when implementing)

- FE: `gsap`, `framer-motion` (V1)
- BE: express, pg, ioredis, jwt, zod, node-pg-migrate or drizzle

## Constraints

- NFR-5: ~$5–10/mo run-rate at launch.
- NFR-4: JWT for admin routes.
- FR-4: 30-minute session idle timeout.

## Documentation index

- Plan: `docs/plan/PLATFORM-PLAN.md`
- ADRs: `docs/adr/`
- API contract: `docs/architecture/openapi-mvp.yaml`
- Design: `docs/design/lagari-visual-direction.md`
