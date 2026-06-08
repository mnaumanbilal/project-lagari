# Product Context — Lagari

## Why this project exists

Lagari sells artisanal, high-concentration **impressions** of iconic international perfumes (e.g. Desert Noir as an impression of Louis Vuitton Ombre Nomade). Shopify’s template and app ecosystem limits brand equity, speed, and analytics. The custom build delivers cinematic luxury UX and owned attribution.

## Problems it solves

1. **Aesthetic restrictions** — generic e-commerce layouts → fluid GSAP/cinematic experience.
2. **Performance bloat** — third-party Shopify apps → native backend features.
3. **Analytics blindspots** — fragmented tracking → unified session + chat + cart attribution.

## How it should work

- **Storefront:** Category browse, luxury PDP (pyramid, color morphing in V1), frictionless **COD** checkout for PK mobile buyers.
- **AI matcher:** Chatbot maps “Bleu de Chanel” / “Savage” typos to Lagari SKUs with in-chat Add to Cart (V1).
- **Admin:** Revenue/conversion tiles, live Redis-backed activity feed, catalog CRUD, order lifecycle with RTO awareness, funnel abandonment lists.
- **Notifications (V1):** Admin toast/Slack; customer SMS/WhatsApp + HTML email on order.

## User experience goals

- Ultra-luxury, memorable visual direction (`@frontend-design` — avoid generic AI aesthetics).
- Fast SSR/SSG for SEO and WhatsApp/Instagram link previews.
- Minimal checkout friction (name + phone + city + address).

## Current state

- Next.js scaffold only; no Lagari branding or commerce flows in code yet.
- Requirements documented in `docs/requirements/`.

## Personas

| Persona | Needs |
|---------|--------|
| **Customer (PK)** | Discover scents, quick COD order, trust via SMS confirmation |
| **Merchant admin** | Confirm COD orders, manage stock, watch live sales, recover abandoned carts |
| **Ops** | Low-stock alerts, courier tracking, RTO risk visibility |
