# Active Context — Lagari

## Current focus

**Admin console** — dark theme, form validation, toasts, product CRUD with field-level errors.

## Recent changes

- Admin **dark theme** (`admin-theme` CSS): warm dark surfaces, `#232018` inputs.
- **Toast system** — `AdminToastProvider` / `useAdminToast` (success, error, warning, info).
- **Form errors** — `ApiError.payload`, BE `issues[]` paths, `parseApiError`, scroll to `data-admin-field`.
- **Product form** — client validation, per-variant errors, slug uniqueness (409 → slug field), strips empty variant rows.
- Docs: `docs/architecture/admin-ux.md`.

## Next steps

1. Extend field-error pattern to other admin forms if added.
2. Optional: shared `useAdminMutation` hook for list actions.

## Default seed admin

- `admin@lagari.pk` / `changeme123`
