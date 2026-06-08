# ADR-004: Media — Cloudinary

**Status:** Accepted  
**Date:** 2026-06-04

## Context

Product imagery must be optimized for mobile PK (NFR-1, NFR-13). Spec mandates Cloudinary CDN.

## Decision

- **MVP:** `product_images` stores **URLs only** (not blobs). Admin can paste URLs or upload via `POST /admin/media/upload` when `CLOUDINARY_*` is configured.
- **V1:** Gallery reorder UI polish, batch upload, transform presets (FR-C1).
- Storefront uses `next/image` with `images.remotePatterns` for Cloudinary host.

## Consequences

**Positive:** Free tier fits NFR-5; automatic WebP/AVIF.

**Negative:** Vendor lock-in; migration script needed from Shopify CDN URLs (ADR-007).
