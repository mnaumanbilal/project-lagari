# lagari-be

Express + PostgreSQL + Sequelize API for Lagari.

**Structure:** follows [pern-alpha](https://github.com) pattern — see [STRUCTURE.md](./STRUCTURE.md) (routes → controllers, config from `.env`).

## Prerequisites

- Node.js 20+
- PostgreSQL (local) with database `lagari` created

## Setup

### 1. Environment (PostgreSQL password)

Your `.env` must use the **password you chose when installing PostgreSQL 18** — not the placeholder `postgres`.

**Interactive setup (recommended):**

```powershell
cd lagari-be
npm run setup:env
```

This tests the connection, creates the `lagari` database if needed, writes `lagari-be/.env`, and `lagari-fe/.env.local`.

**Manual:** copy `.env.example` → `.env` and set `DB_PASSWORD=...`

### 2. Install & database

```bash
cd lagari-be
npm install
npm run db:create    # first time only
npm run db:migrate
npm run db:seed
npm run dev
```

**Local development:** use `npm run dev` (TypeScript via `tsx`, no `dist/` needed).

**Production-style:** `npm run build` then `npm start` (or `npm start` — runs `prestart` build automatically).

API base: `http://localhost:4000`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start API with hot reload |
| `npm run db:migrate` | Run Sequelize migrations |
| `npm run db:seed` | Seed categories, sample product, admin |
| `npm run db:reset` | Undo all migrations, re-migrate, re-seed |

## Default admin (after seed)

- Email: `admin@lagari.pk` (or `SEED_ADMIN_EMAIL`)
- Password: `changeme123` (or `SEED_ADMIN_PASSWORD`)

## Quick test

```bash
# Health
curl http://localhost:4000/health

# Session
curl -X POST http://localhost:4000/sessions

# Catalog
curl http://localhost:4000/catalog/products
curl http://localhost:4000/catalog/products/desert-noir
```

## Redis

Optional. Set `REDIS_URL` for production-like cart storage. Without it, an in-memory fallback is used for local dev.

## Contract

OpenAPI reference: `../docs/architecture/openapi-mvp.yaml`
