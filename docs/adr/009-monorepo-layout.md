# ADR-009: Monorepo layout

**Status:** Accepted  
**Date:** 2026-06-04

## Context

Repo contains FE, BE, and extensive docs. Optional shared types between apps.

## Decision

```
project-lagari/
  lagari-fe/          # Next.js — own package.json
  lagari-be/          # Express — own package.json (created P2)
  docs/               # plan, adr, architecture, design, requirements
  memory-bank/        # AI context
```

- **No** npm workspaces in MVP — duplicate minimal types or copy from OpenAPI codegen later.
- Optional `packages/types` in P2+ if drift becomes painful.

Deploy: independent CI jobs per folder (Vercel watches `lagari-fe`, Railway watches `lagari-be`).

## Consequences

**Positive:** Simple; clear ownership.

**Negative:** Manual sync of API types until codegen added.
