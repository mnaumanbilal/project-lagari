# ADR-007: Shopify migration

**Status:** Accepted  
**Date:** 2026-06-04

## Context

lagari.pk runs on Shopify today. Cutover must preserve SEO and product data (FR-M1, FR-M2).

## Decision

### Export

1. Shopify Admin export: products CSV + images.
2. Script `lagari-be/scripts/import-shopify.ts` maps:
   - Title → `products.title`
   - Handle → `products.slug`
   - Tags → categories / note_tags
   - Metafields → `designer_inspiration`
   - Images → Cloudinary upload queue

### Redirects

- Table `url_redirects (from_path, to_path, status_code)` default 301.
- Next.js `middleware.ts` checks redirects table via API or static JSON export at build.

### Cutover checklist

1. Freeze Shopify checkout (maintenance banner).
2. Deploy Lagari MVP; smoke COD on staging.
3. DNS `lagari.pk` → Vercel.
4. Monitor 404s; append redirects.
5. Shopify shop read-only 30 days then cancel plan.

## Consequences

**Positive:** Controlled migration; impression metafields normalized.

**Negative:** Manual redirect mapping for legacy collection URLs; historical orders optional import.
