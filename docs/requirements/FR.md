# Lagari — Functional Requirements

**Source:** [Lagari Project Document.docx](../source/Lagari%20Project%20Document.docx)  
**Legend:** MVP = first shippable slice; V1 = post-MVP; P2 = later

## Core (document §5)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Admin create/read/update/soft-delete products with image arrays | MVP |
| FR-2 | Order status workflow: Pending → Confirmed → Shipped → Delivered / RTO | MVP |
| FR-3 | AI chatbot resolves misspelled designer names → product card in ≤2.5s | V1 |
| FR-4 | Analytics sessions; end after 30 min idle | MVP |
| FR-5 | Metafield: designer inspiration name for filter + AI | MVP |

## Storefront (§4A)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-S1 | GSAP cinematic landing (scroll-driven product/typography motion) | V1 |
| FR-S2 | Background color morphing by fragrance profile | V1 |
| FR-S3 | Interactive scent pyramid (top/heart/base notes) | V1 |
| FR-S4 | One-page COD checkout (name, mobile, city, address) | MVP |
| FR-S5 | SSR OpenGraph/metadata per product (social previews) | MVP |
| FR-S6 | Design system tokens documented before page build (`docs/design/`) | MVP (planning) |
| FR-S7 | Guest-only checkout — no account required for COD | MVP |
| FR-S8 | PK city selection — static city list MVP; carrier API V1 | MVP / V1 |
| FR-S9 | Discover by note family — Oud, Citrus, Floral, Woody, Gourmand filters | MVP |
| FR-S10 | Variant model — size/concentration SKUs with independent price/stock | MVP |
| FR-S11 | WhatsApp/social share — PDP OG image and copy for deep links | MVP |

## AI chatbot (§4B)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A1 | Map user scent queries to designer impression index | V1 |
| FR-A2 | Chat Markdown → product cards with price + Add to Cart | V1 |

## Admin dashboard (§4C)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-D1 | Tiles: net revenue, conversion rate, sessions, AOV | V1 (simplified counts MVP) |
| FR-D2 | Live activity feed via SSE/WebSocket | V1 |
| FR-D3 | Catalog CRUD (titles, content, media, price, impression tags) | MVP |
| FR-D4 | Funnel + abandoned checkout recovery list (phone/email) | V1 |
| FR-D5 | Admin auth — email/password + JWT refresh; single admin role MVP | MVP |
| FR-D6 | COD confirmation gate — admin must confirm before ship (Pending→Confirmed) | MVP |

## Catalog engine (Appendix D)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-C1 | Cloudinary gallery: reorder, hero image, thumbnails | V1 |
| FR-C2 | Batch sale price / visibility on multiple SKUs | V1 |
| FR-C3 | Low-stock threshold → admin visual warning | MVP |

## Orders (Appendix E)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-O1 | Order detail: customer, items, discounts | MVP |
| FR-O2 | Customer risk profile by phone (RTO/refusal history) | V1 |
| FR-O3 | Order timeline audit log | MVP |

## Notifications (Appendix F)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-N1 | Admin toast + sound on new order | V1 |
| FR-N2 | Slack/Discord webhook on new order | V1 |
| FR-N3 | Customer SMS/WhatsApp on order placed | V1 |
| FR-N4 | Customer HTML invoice email + tracking link | V1 |

## Catalog taxonomy

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-T1 | Categories: For Men, For Women, Unisex, All (multi-tag) | MVP |
| FR-T2 | Extensible schema for future non-fragrance categories | MVP (schema only) |

## Migration (planning P1)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-M1 | Shopify product export import into PostgreSQL | MVP (launch) |
| FR-M2 | URL redirect map — legacy Shopify paths → new routes (301) | MVP (launch) |

## Engineering order (spec §9)

1. Database schema → 2. Node API → 3. Next.js + Tailwind → 4. GSAP + OpenRouter
