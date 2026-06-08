# Lagari — Shopify Gap Matrix

Lagari replaces Shopify for **lagari.pk** but is **not** a full platform clone. This matrix maps Shopify capabilities to spec priority.

| Shopify area | Lagari approach | MVP | V1+ | Out of scope |
|--------------|-----------------|-----|-----|--------------|
| Online storefront | Custom Next.js luxury UX (GSAP, Framer) | Browse + PDP | Cinematic landing, pyramid | Liquid theme editor |
| Checkout | One-page **COD** (name, phone, city, address) | Yes | Carrier API cities | Card-first / Shop Pay |
| Customer accounts | Low friction; avoid registration barriers | Optional/minimal | — | Full account portal parity |
| Shopify Payments | COD only in spec | Yes | — | Built-in PSP |
| Shipping | City dropdown → carrier APIs | Static/semi-static cities | Live carrier API | Multi-entity shipping |
| Discounts | Admin batch markdown | — | Eid campaigns | Complex rule engine |
| Products / variants | PostgreSQL + metafields | CRUD + soft delete | Batch actions | — |
| Inventory | Stock + low-stock thresholds | Yes | — | Multi-location POS |
| Orders | Pending → Confirmed → Shipped → Delivered/RTO | Yes | Risk profile | — |
| Analytics | Native sessions, funnels, Redis live metrics | Sessions + basic tiles | Live feed, abandonment | Shopify Analytics apps |
| Marketing apps | Native chatbot + attribution | — | OpenRouter matcher | App store |
| Notifications | Email + SMS/WhatsApp + Slack | — | Full module F | — |
| Metafields | Designer inspiration | Yes | — | Full metafield UI parity |
| POS / multi-store | — | — | — | Yes |
| B2B wholesale | — | — | — | Yes |
| Content / blog | Policy/landing SSG | Static pages | — | Full CMS |
| Migration | Shopify decommission stated | ADR TBD | Import tooling | — |

**Lagari-only differentiators (not Shopify):** AI impression matcher, symphonic color morphing, scent pyramid, proprietary session↔chat↔cart attribution, PK-focused COD + RTO risk profile.
