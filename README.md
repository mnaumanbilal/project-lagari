# Lagari

Luxury fragrance e-commerce for [lagari.pk](https://www.lagari.pk) — custom platform replacing Shopify.

## Documentation (start here)

| Doc | Description |
|-----|-------------|
| [docs/plan/PLATFORM-PLAN.md](docs/plan/PLATFORM-PLAN.md) | Master platform plan |
| [docs/plan/ROADMAP.md](docs/plan/ROADMAP.md) | Phase checklist |
| [docs/plan/SESSION-LOG.md](docs/plan/SESSION-LOG.md) | Session handoff log |
| [docs/requirements/FR.md](docs/requirements/FR.md) | Functional requirements |
| [docs/adr/](docs/adr/) | Architecture decisions |
| [memory-bank/](memory-bank/) | AI session context |

## Repo layout

- `lagari-fe/` — Next.js 16 storefront + admin (scaffold)
- `lagari-be/` — Express API (planned)
- `docs/` — plan, requirements, architecture, design

## Development

```bash
cd lagari-fe
npm install
npm run dev
```

**Implementation gate:** Commerce and API work start after P1 plan review and explicit **execute P2** from the team.

## Status

**Phase P1** — Planning artifacts in repo. No commerce application code yet.
