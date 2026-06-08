# Lagari — Visual direction (luxury fragrance)

**Version:** P1 (2026-06-04)  
**Status:** Approved for planning — implement tokens in `lagari-fe` before page builds  
**Skill reference:** `@frontend-design` (distinctive, non-generic aesthetics)

---

## 1. Creative direction

### One-line brief

**Nocturnal opulence** — a Pakistani luxury house that sells *impressions* of world icons, not mass-market dupes. The site should feel like a fragrance editorial crossed with a private atelier, not a Shopify theme.

### Tone

- **Refined maximalism:** Rich atmosphere, selective ornament, never cluttered bargain-bin energy.
- **Confident restraint:** Fewer UI chrome elements; more photography, typography, and space.
- **Cultural warmth:** Subtle hospitality (Urdu micro-copy optional in V1) without kitsch.

### What we refuse (anti-patterns)

| Avoid | Use instead |
|-------|-------------|
| Geist, Inter, Roboto, Arial | Distinctive pairing below |
| Purple gradients on white | Deep umber/black bases + brass accent |
| 3-column equal product grids | Staggered editorial rows, hero-led lists |
| Generic “shop now” hero | Impression story per collection |
| Floating chat bubble (green) | Integrated scent concierge panel (V1) |

---

## 2. Typography

Load via `next/font/google` or self-hosted licenses as needed.

| Role | Family | Usage |
|------|--------|--------|
| **Display** | **Cormorant Garamond** (600–700) | Headlines, product names, campaign type |
| **Body** | **DM Sans** (400–500) | UI, descriptions, checkout |
| **Accent / labels** | **IBM Plex Mono** (400, spaced caps) | SKU, “Inspired by”, note labels |

**Scale:** Display  clamp(2.5rem, 5vw, 4.5rem); body 1rem/1.6; labels 0.75rem letter-spacing 0.12em.

**Remove** Geist from `app/layout.tsx` when implementing P4.

---

## 3. Color system (CSS variables)

Default theme: **dark storefront** (oud/night). Admin may use a **lighter control-room** variant sharing brass accent only.

```css
/* Storefront — lagari-fe/styles/tokens.css (planned) */
:root {
  --lagari-bg-deep: #0a0908;
  --lagari-bg-elevated: #141210;
  --lagari-surface: #1c1916;
  --lagari-text-primary: #f5f0e8;
  --lagari-text-muted: #a39e94;
  --lagari-accent-brass: #c9a962;
  --lagari-accent-brass-dim: #8a7340;
  --lagari-border: rgba(201, 169, 98, 0.15);
  --lagari-danger: #c45c4a;
  --lagari-success: #6b8f71;

  /* Scent profiles (V1 morph — FR-S2) */
  --lagari-profile-light: #2a2838;
  --lagari-profile-dark: #0a0908;
}
```

**Light summer fragrances:** shift toward `--lagari-profile-light` on PDP (V1). MVP uses static dark base.

---

## 4. Layout & composition

### Storefront

- **Home:** Full-viewport hero with single featured impression; vertical scroll reveals 2–3 “chapters” (brand story, bestsellers, COD trust strip).
- **Listing:** Asymmetric grid — one large feature card + smaller companions; filter chips (category + note family) as horizontal scroll.
- **PDP:** Split layout — image stack left (60%), story + variant selector right; designer inspiration as mono label above title.
- **Checkout:** Single column, max-width 28rem, no sidebar distractions.

### Admin

- **Dark control room** (implemented): `#0c0b0a` base, elevated cards `#1a1815`, input fill `#232018` — not white fields.
- DM Sans for UI; brass for primary actions; toasts + inline field errors (see `docs/architecture/admin-ux.md`).

---

## 5. Imagery & texture

- **Photography:** High contrast, dark surround, product centered; consistent 4:5 crop on cards.
- **Grain:** Optional 3% noise overlay on hero (`mix-blend-mode: overlay`) — CSS only, no heavy assets.
- **Cloudinary:** `f_auto,q_auto,w_800` cards; `w_1200` PDP hero (ADR-004).

---

## 6. Motion

| Phase | Approach |
|-------|----------|
| **MVP** | CSS transitions (300–500ms ease); `prefers-reduced-motion: reduce` disables transforms (NFR-12) |
| **MVP** | Framer Motion for cart drawer, modal, page enter (light) |
| **V1** | GSAP ScrollTrigger on home (FR-S1); pyramid reveal on PDP (FR-S3) |

**Rule:** One strong entrance per viewport — no animation soup.

---

## 7. Components (MVP priority)

1. `SiteHeader` — minimal logo, category nav, cart icon
2. `ProductCard` — editorial, not square grid clone
3. `VariantSelector` — pill buttons, stock state
4. `CartDrawer`
5. `CodCheckoutForm` — large touch targets for mobile PK
6. `OrderStatusChip` (admin)

---

## 8. Social / WhatsApp (FR-S11)

PDP `generateMetadata` must produce:

- `og:title` — `{product} — Lagari`
- `og:description` — `Inspired by {designer}. Artisanal impression. COD across Pakistan.`
- `og:image` — hero Cloudinary URL 1200×630 crop

---

## 9. Logo asset

- File: `lagari-fe/app/assets/images/lagari-white-no-bg.png` (white mark, transparent BG).
- Component: `components/brand/LagariLogo.tsx` — pass **`onLight`** on white/light surfaces so Tailwind `invert` renders black.
- Default (dark storefront): no invert.

## 10. Acceptance before P4 UI

- [x] Tokens in `app/globals.css`
- [x] Fonts wired in root layout (Cormorant, DM Sans, IBM Plex Mono)
- [x] Geist removed
- [x] Storefront MVP with dummy catalog (`lib/data/dummy-products.ts`)

---

## 10. References (mood, not copy)

- Niche perfumery editorial sites (asymmetric type, dark luxury)
- Fashion lookbooks — full-bleed, slow scroll
- **Not** references: default Shopify Dawn, Amazon product grids

Update this doc when brand assets (logo SVG, photography guidelines) are finalized.
