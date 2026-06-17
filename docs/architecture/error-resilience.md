# Error handling & resilience

Source of truth for how Lagari surfaces errors to users and how the backend
stays resilient. **Read this before touching any form, API error path, or
external/dependency call.** The goal: a failure is never silent, never shows a
raw 500 to a user, and never breaks the happy path.

---

## 1. Frontend error-display contract

Every form/mutation maps an error to exactly one channel, in this precedence:

1. **Field-level** — under the specific input (`contactPhone`, `contactEmail`, `slug`, …)
2. **Section-level** — under a fieldset/group (`_contact`, `variants`, …)
3. **Form-level** — banner at the top of the form (`_form`)
4. **Toast fallback** — only when nothing field/section-specific applies, or the
   banner may be scrolled out of view

A failure must always land in at least one channel. "Silent" is a bug.

### Two natures of failure

| Nature | Example | How it arrives | Rule |
|--------|---------|----------------|------|
| **Business warning (HTTP 200)** | Review eligibility `canSubmit: false` (`limit_reached`, `no_purchase`) | Normal `200` JSON body | Must be mapped to a visible channel — a `200` is **not** success here |
| **HTTP error (4xx/5xx/network)** | Submit `409`, `422`, `429`, `500`, offline | Thrown `ApiError` (or `TypeError` for network) | Map via the shared parser; never show raw internals on `5xx` |

### Structured `field` / `code` (preferred over message text)

The backend tags errors with a machine-readable `code` and a `field`/section.
The frontend maps on these first; **message-text matching is a last resort**
(brittle — breaks if copy changes).

```jsonc
// Eligibility 200 body (failure)
{ "canSubmit": false, "reason": "limit_reached",
  "code": "REVIEW_LIMIT_REACHED", "field": "contact",
  "message": "You've already reviewed this product…" }

// Error response body (4xx/5xx) — errorHandler.ts
{ "error": "…", "code": "REVIEW_LIMIT_REACHED", "field": "contact" }
```

`field` values: `"phone"` → `contactPhone`, `"email"` → `contactEmail`,
`"contact"` → `_contact` section.

### Shared helpers (do not build parallel systems)

| Concern | Storefront | Admin |
|---------|-----------|-------|
| Parse error → field map | `parseStorefrontApiError` (`lib/storefront/api-errors.ts`) | `parseApiError` (`lib/admin/field-errors.ts`) |
| 200 eligibility → fields | `eligibilityToFieldErrors` | — |
| Apply + scroll + toast | `reportStorefrontErrors` | `applyFieldErrors` + `useAdminToast` |
| Inline message UI | `FieldMessage` | `AdminField` |
| Toast | `useStorefrontToast()` | `useAdminToast()` |

### Rate limiting & network

- **429** → always form-level message + toast, never a field error.
- **Network / non-`ApiError`** → "check your connection" form-level message + toast.
- **5xx** → generic "something went wrong on our end" (internals stay in logs).

### Optimistic updates

Optimistic cache mutations (e.g. admin review publish/delete) **must** roll back
in `onError`, not only refetch in `onSettled`. Return the applied delta from
`onMutate` and invert it on error (see `use-admin-mutations.ts` →
`rollbackReviewCounts`).

### Do / Don't

- Do: pass `toast` into `reportStorefrontErrors`; guard debounced async with a
  sequence ref so a stale response can't overwrite newer input.
- Do: add `data-storefront-field` / `data-admin-field` anchors so scroll-to-error works.
- Don't: clear all field errors and then forget to re-apply server errors.
- Don't: show a green "verified" tick when an eligibility check failed or errored.

---

## 2. Backend error taxonomy

`utils/error-taxonomy.ts` classifies any error:

| Category | Source | Retryable? |
|----------|--------|-----------|
| `validation` | `ZodError` | No |
| `business` | `AppError` 4xx | No |
| `transient` | network codes (`ECONNRESET`, `ETIMEDOUT`…), dependency `502/503/504`, Sequelize connection errors | **Yes** |
| `internal` | `AppError` 5xx, anything else | No (logged) |

`isTransientError(err)` is the single predicate used by the retry layer.

### `AppError` carries structured metadata

```ts
throw new AppError(409, "You've already reviewed…", {
  code: "REVIEW_LIMIT_REACHED",
  field: "contact",
});
```

`errorHandler.ts` echoes `code`/`field` into the JSON body (additive — existing
`{ error, details?, issues? }` shape unchanged) and logs `5xx`/unknown errors via
pino with the request's `requestId`.

---

## 3. Retry policy

`utils/retry.ts` → `withRetry(fn, options)`: bounded exponential backoff + jitter,
retries **only** transient errors, re-throws the last error on give-up.

```ts
await withRetry(() => sendSlackMessage(text), { label: "slack.webhook" });
```

### Where retries ARE applied (infrastructure boundaries)

- Slack webhook (`providers/slack.provider.ts`)
- Email send (`providers/email.provider.ts`)
- (Add: other external HTTP / reconnectable DB reads as needed)

### Where retries are NOT applied (idempotency)

- **Order creation, review submission, Cloudinary upload** — non-idempotent
  writes. Retrying could duplicate orders/assets. Single attempt only unless a
  dedup/idempotency key is introduced.
- Business/validation failures (`409`, `422`, Zod) — never retried.

---

## 4. Crash prevention

`index.ts` installs process guards:

| Signal | Behaviour |
|--------|-----------|
| `unhandledRejection` | Log loudly via pino; **keep serving** (one stray rejection shouldn't kill the API) |
| `uncaughtException` | Log fatal; **graceful drain** (close HTTP server + Sequelize pool, 10s timeout) then `exit(1)` for supervisor restart |
| `SIGTERM` / `SIGINT` | Graceful shutdown, `exit(0)` — clean deploys/restarts |

`requestId` middleware attaches a correlation id to every request (honours an
inbound `X-Request-Id`), echoed on the response and included in error logs.

---

## 5. Logging (pino)

`utils/logger.ts` — one shared pino instance.

- **Local dev:** pretty, colourised.
- **Production / test:** structured JSON (one line per event).
- Errors logged with `{ err, requestId }`. User-facing messages stay clean;
  stack traces and internals go to logs only.

---

## 6. QA matrix

| Scenario | Expected UI / behaviour |
|----------|-------------------------|
| Eligibility `limit_reached` (200) | Message under contact fieldset |
| Eligibility `no_purchase` / `not_found` (200) | Identical message under contact fieldset (non-enumerating) |
| Submit `409` (limit reached) | Message under contact + toast if banner off-screen |
| Submit `422` invalid phone | Under phone field |
| Submit `429` rate limit | Friendly "please wait" toast/banner |
| Network failure on eligibility | Silent during debounce; no false green tick |
| Network failure on submit | Form error + toast |
| Admin mutation fails after optimistic patch | Cache rolls back; toast shown |
| Non-JSON / `502` dependency response | Generic safe message + toast; logged with `requestId` |
| Checkout / admin happy path | Identical to before |

---

## 7. Security: non-enumeration

The eligibility endpoint must **not** reveal whether a phone/email exists.
`not_found` and `no_purchase` share one `code` (`PURCHASE_NOT_VERIFIED`) and one
identical message. Keep them in lockstep when editing copy.

---

## 8. Tests

Vitest in both packages (`npm test`):

- **BE:** `error-taxonomy`, `retry`, `errorHandler` envelope (`src/**/__tests__`).
- **FE:** `eligibilityToFieldErrors`, `parseStorefrontApiError` precedence /
  429 / 5xx / network (`lib/storefront/__tests__`).

**Pre-merge gates:** `npm run build`, `npm run lint`, `npm test` on both packages.
