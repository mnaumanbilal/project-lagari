# Lagari — Non-Functional Requirements

**Source:** [Lagari Project Document.docx](../source/Lagari%20Project%20Document.docx)

## Documented (§6)

| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-1 | Performance | PageSpeed / Core Web Vitals | ≥ 90 mobile & desktop |
| NFR-2 | SEO / social | Product PDP meta in initial SSR response | Full OG tags per product |
| NFR-3 | Availability | Vercel Edge storefront | 99.9% uptime |
| NFR-4 | Security | Admin mutations & analytics | JWT on protected routes |
| NFR-5 | Cost | Launch traffic | < $15 USD/month total infra |

## Extended (planning)

| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-6 | Accessibility | Storefront + admin | WCAG 2.1 AA |
| NFR-7 | Privacy | Phone numbers, session tracking | Minimize retention; secure at rest |
| NFR-8 | Observability | API & order pipeline | Structured logs; error alerting |
| NFR-9 | AI latency | Scent matcher (FR-3) | p95 ≤ 2.5s including API round-trip |
| NFR-10 | Cache | DB reads | Redis layer per NFR-5 budget |
| NFR-11 | Audit | Order status changes | Immutable timeline (FR-O3) |
| NFR-12 | Motion | `prefers-reduced-motion` honored for animations | CSS/GSAP fallbacks |
| NFR-13 | Performance | PDP LCP on 4G PK | Hero ≤ 2.5s |
| NFR-14 | API latency | Catalog, cart, checkout p95 | ≤ 300ms (excl. LLM) |
| NFR-15 | Security | Rate limiting | Public APIs + login |
| NFR-16 | Privacy | PII retention policy | Phone/address documented |
| NFR-17 | Reliability | Database backups | Daily snapshot (Neon/Supabase) |

## Deployment matrix (spec §8)

| Service | Provider | Est. cost |
|---------|----------|-----------|
| Frontend | Vercel Edge free | $0 |
| Backend | Railway / Render hobby | $5–7 |
| PostgreSQL | Neon / Supabase free | $0 |
| Redis | Upstash free tier | $0 |
| Media | Cloudinary free | $0 |
| LLM | OpenRouter pay-as-you-go | ~$3 pool |

## Agent / implementation notes

- Next.js **16** — follow `lagari-fe/AGENTS.md` and bundled docs.
- FE skills: `@frontend-design`, `@frontend-developer`.
- API framework: **Express** — see [ADR-001](../adr/001-api-framework.md).
- Plan & roadmap: [docs/plan/PLATFORM-PLAN.md](../plan/PLATFORM-PLAN.md).
