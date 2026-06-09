import type { ApiError } from "@/lib/api/client";
import {
  inferFieldFromMessage,
  parseValidationPayload,
  type ApiErrorPayload,
} from "@/lib/api/errors";

export type FieldErrors = Record<string, string>;

export function parseApiError(err: ApiError): FieldErrors {
  const payload = err.payload ?? {};
  const fields = normalizeApiFieldErrors(parseValidationPayload(payload));

  const inferred = inferFieldFromMessage(err.message, err.status);
  if (inferred && !fields[inferred]) {
    fields[inferred] = err.message;
  }

  if (!Object.keys(fields).length && err.message && err.status !== 500) {
    fields._form = err.message;
  }

  return fields;
}

const FIELD_PRIORITY = [
  "title",
  "slug",
  "categorySlugs",
  "noteTagSlugs",
  "description",
  "imageUrls",
  "variants",
];

/** First field to scroll to (priority order) */
export function firstErrorField(errors: FieldErrors): string | null {
  const keys = Object.keys(errors).filter((k) => k !== "_form");
  if (!keys.length) return null;

  for (const key of FIELD_PRIORITY) {
    if (errors[key]) return key;
  }

  const variantKey = keys.find((k) => k.startsWith("variants."));
  if (variantKey) return variantKey;

  return keys[0] ?? null;
}

export function scrollToAdminField(fieldKey: string) {
  if (typeof document === "undefined") return;
  const el =
    document.querySelector(`[data-admin-field="${fieldKey}"]`) ??
    document.querySelector(`[data-admin-field="${fieldKey.split(".")[0]}"]`);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function applyFieldErrors(
  errors: FieldErrors,
  setFieldErrors: (e: FieldErrors) => void,
) {
  setFieldErrors(errors);
  const first = firstErrorField(errors);
  if (first) {
    requestAnimationFrame(() => scrollToAdminField(first));
  }
}

export function getFieldError(
  errors: FieldErrors,
  field: string,
  index?: number,
): string | undefined {
  if (errors[field]) return errors[field];

  for (const [key, msg] of Object.entries(errors)) {
    if (key.startsWith(`${field}.`)) return msg;
  }

  if (index !== undefined) {
    const prefixed = `variants.${index}`;
    for (const [key, msg] of Object.entries(errors)) {
      if (key === prefixed || key.startsWith(`${prefixed}.`)) return msg;
    }
  }

  if (field === "variants" && errors.variants) return errors.variants;
  return undefined;
}

export function hasFieldError(errors: FieldErrors, field: string): boolean {
  return getFieldError(errors, field) !== undefined;
}

/** First human-readable message for toasts (skips generic API wrapper text when possible) */
export function firstErrorMessage(errors: FieldErrors): string | null {
  const field = firstErrorField(errors);
  if (field && errors[field]) return errors[field];

  for (const [key, msg] of Object.entries(errors)) {
    if (key !== "_form" && msg) return msg;
  }

  return errors._form ?? null;
}

/** Normalize API validation keys to match admin form field keys */
export function normalizeApiFieldErrors(errors: FieldErrors): FieldErrors {
  const out: FieldErrors = { ...errors };

  for (const [key, msg] of Object.entries(errors)) {
    if (key.startsWith("imageUrls.")) {
      const mapped = key.replace(/^imageUrls/, "images");
      if (!out[mapped]) out[mapped] = msg;
    }
    if (key === "imageUrls" && !out.images) out.images = msg;
  }

  return out;
}
