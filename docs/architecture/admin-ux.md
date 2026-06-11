# Admin panel UX — theme, forms, errors

## Theme

Admin uses `.admin-theme` on `/admin-panel-route` (see `lagari-fe/app/globals.css`):

- **Dark control room** — `#0c0b0a` base, `#1a1815` cards, `#232018` inputs (not white)
- **Typography** — DM Sans for UI; Cormorant for page titles; IBM Plex only on `.admin-btn-primary`
- **Accent** — storefront brass (`#c9a962`)

Storefront tokens are unchanged; admin overrides CSS variables under `.admin-theme`.

## Toasts

- Provider: `AdminToastProvider` in `AdminProviders`
- Hook: `useAdminToast()` → `success`, `error`, `warning`, `info`
- Use for: auth failures, save success, generic API errors, import results
- Field-level validation: inline under inputs **and** toast when multiple fields fail

## Form errors & API mapping

| Layer | Module |
|-------|--------|
| API body | `{ error, details?, issues? }` — `issues[].path` from Zod (BE `errorHandler.ts`) |
| Client parse | `lib/api/errors.ts`, `lib/admin/field-errors.ts` |
| Scroll | `data-admin-field="{path}"` on wrappers; `scrollToAdminField()` on submit failure |
| Product form | `lib/admin/product-form-validation.ts` (client) + `AdminField` components |

### Slug uniqueness

- **BE:** `admin.product.service` → `409` + `"Slug already in use"` on duplicate `products.slug`
- **FE:** `inferFieldFromMessage()` maps 409 slug errors to field `slug`; warning toast

### Variant validation

Empty extra variant rows are **stripped before submit**. Client requires SKU + name per kept row. API Zod errors use paths like `variants.0.sku` (via `issues` array).

## Product description (rich text)

- **Admin:** `AdminRichTextEditor` — toolbar (bold, italic, heading, list); stores **sanitized HTML**.
- **BE:** `sanitizeProductHtml()` on create/update (`lagari-be/src/utils/sanitizeHtml.ts`).
- **Storefront:** PDP renders `description` via `dangerouslySetInnerHTML` (existing).

## Product images (Cloudinary)

**Do not store image binaries in PostgreSQL.**

| Layer | Responsibility |
|-------|----------------|
| **Cloudinary** | Original files + CDN transforms (`f_auto`, `q_auto`, widths) |
| **PostgreSQL** | `product_images.url` (text), `sort_order`, `is_hero` only |
| **Admin upload** | `POST /admin/media/upload` (multipart) → Cloudinary → returns `url` |
| **Fallback** | Paste Cloudinary (or any HTTPS) URL if `CLOUDINARY_*` env not set |

Env in `lagari-be/.env`:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=lagari/products
```

`GET /admin/media/capabilities` → `{ cloudinaryUpload: boolean }` drives the upload button in `AdminProductImages`.

See [ADR-004](../adr/004-media-cloudinary.md).

## Adding a new admin form

1. Wrap fields in `data-admin-field` keys matching API issue paths
2. Run client validation before `apiFetch`
3. `catch (ApiError)` → `parseApiError` → `applyFieldErrors` + appropriate toast
4. Use `admin-input` / `AdminTextField` for consistent styling

## Confirm dialogs and bulk actions

Destructive or irreversible admin actions use shared components:

| Component | Path | Use |
|-----------|------|-----|
| `AdminConfirmDialog` | `components/admin/AdminConfirmDialog.tsx` | Modal before delete, archive, bulk ops |
| `useAdminRowSelection` | `lib/admin/hooks/use-admin-row-selection.ts` | Checkbox selection state |
| `AdminBulkActionBar` | `components/admin/AdminBulkActionBar.tsx` | Sticky bar when rows selected |

**Products:** soft-delete (hidden from shop; order snapshots kept). Confirm before single or bulk delete.

**Orders:** soft-archive via `archived_at` (admin list housekeeping only; status workflow unchanged). Default list shows active orders only.

**Reviews:** hard-delete requires confirm; bulk publish/unpublish/delete via bulk API.

Bulk API responses: `{ succeeded, failed: [{ id, error }] }` — toast partial success when needed.

## Mobile responsiveness

Breakpoint **`lg` (1024px)** — tables at `lg+`, card lists below.

| Component | Path | Use |
|-----------|------|-----|
| `AdminUserMenu` | `components/admin/AdminUserMenu.tsx` | Header profile circle → Storefront, Sign out |
| `AdminRowActionsMenu` | `components/admin/AdminRowActionsMenu.tsx` | Row actions: inline on desktop; on mobile, kebab when 2+ actions |
| `AdminListCard` | `components/admin/AdminListCard.tsx` | Mobile list row shell + labeled field grid |

**Nav:** desktop sidebar (`md+`); mobile horizontal scroll tabs below header.

**Lists:** Orders, Products, Dashboard recent orders, Analytics top products use dual layout (`hidden lg:block` table + `lg:hidden` cards).

**Notifications:** fixed panel under header on small screens with backdrop tap-to-close.
