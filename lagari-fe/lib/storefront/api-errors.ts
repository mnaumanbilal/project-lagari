import { ApiError } from "@/lib/api/client";
import { parseValidationPayload } from "@/lib/api/errors";
import type { ReviewEligibilityResult } from "@/lib/api/reviews";

/** Storefront form field key → error message */
export type StorefrontFieldErrors = Record<string, string>;

const API_FIELD_MAP: Record<string, string> = {
  contactPhone: "contactPhone",
  contactEmail: "contactEmail",
  authorName: "authorName",
  body: "body",
  rating: "rating",
  fullName: "fullName",
  phone: "phone",
  email: "email",
  city: "city",
  address: "address",
};

function mapApiFieldKeys(fields: Record<string, string>): StorefrontFieldErrors {
  const out: StorefrontFieldErrors = {};
  for (const [key, message] of Object.entries(fields)) {
    const mapped = API_FIELD_MAP[key] ?? key;
    if (!out[mapped]) out[mapped] = message;
  }
  return out;
}

function inferFieldFromMessage(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes("email")) return "contactEmail";
  if (lower.includes("phone") || lower.includes("mobile")) return "contactPhone";
  if (lower.includes("name")) return "authorName";
  if (lower.includes("address")) return "address";
  if (lower.includes("city")) return "city";
  return null;
}

/** Map a structured `field` value from the API to a storefront form key. */
function fieldToKey(field: string | undefined): string | null {
  switch (field) {
    case "phone":
      return "contactPhone";
    case "email":
      return "contactEmail";
    case "contact":
      return "_contact";
    default:
      return null;
  }
}

/**
 * Parse HTTP error responses into field-level errors.
 *
 * Precedence: structured `field` from the API → Zod validation payload →
 * message-text inference (last resort) → form-level fallback. Network/unknown
 * errors and 5xx always fall back to a safe, generic form-level message.
 */
export function parseStorefrontApiError(err: unknown): StorefrontFieldErrors {
  if (!(err instanceof ApiError)) {
    // Network failure, JSON parse error, or anything non-HTTP.
    return { _form: "Something went wrong. Please check your connection and try again." };
  }

  // 1. Prefer the structured field the backend told us about.
  const structuredKey = fieldToKey(err.payload?.field);
  if (structuredKey) return { [structuredKey]: err.message };

  // 2. Zod / validation issues mapped to known fields.
  const fromPayload = mapApiFieldKeys(parseValidationPayload(err.payload ?? {}));
  if (Object.keys(fromPayload).length > 0) return fromPayload;

  // 3. Rate limiting — never a field error.
  if (err.status === 429) {
    return { _form: err.message || "You're doing that too fast. Please wait a moment and try again." };
  }

  // 4. Last-resort message inference (kept narrow to avoid mis-targeting).
  const inferred = inferFieldFromMessage(err.message);
  if (inferred) return { [inferred]: err.message };

  // 5. Generic fallback. 5xx must never expose internals.
  if (err.status >= 500) {
    return { _form: "Something went wrong on our end. Please try again in a moment." };
  }
  return { _form: err.message || "Something went wrong. Please try again." };
}

/** Map a 200 OK eligibility failure into field errors. */
export function eligibilityToFieldErrors(
  result: Extract<ReviewEligibilityResult, { canSubmit: false }>,
): StorefrontFieldErrors {
  // Prefer the structured field from the backend.
  const structuredKey = fieldToKey(result.field);
  if (structuredKey) return { [structuredKey]: result.message };

  // Fallback for older backends that don't send `field`.
  switch (result.reason) {
    case "contact_invalid":
    case "contact_required": {
      const inferred = inferFieldFromMessage(result.message);
      if (inferred) return { [inferred]: result.message };
      return { _contact: result.message };
    }
    case "ambiguous_email":
      return { contactEmail: result.message };
    case "not_found":
    case "no_purchase":
    case "limit_reached":
      return { _contact: result.message };
    default:
      return { _form: result.message };
  }
}

export function getStorefrontFieldError(
  errors: StorefrontFieldErrors,
  field: string,
): string | undefined {
  return errors[field];
}

export function hasStorefrontFieldError(
  errors: StorefrontFieldErrors,
  field: string,
): boolean {
  return Boolean(errors[field]);
}

/** First error message suitable for a toast when no field could be targeted. */
export function storefrontToastMessage(errors: StorefrontFieldErrors): string | null {
  const fieldKeys = Object.keys(errors).filter((k) => !k.startsWith("_"));
  if (fieldKeys.length > 0) return null;
  return errors._form ?? errors._contact ?? null;
}

export function scrollToStorefrontField(field: string) {
  if (typeof document === "undefined") return;
  document
    .querySelector(`[data-storefront-field="${field}"]`)
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * Apply field errors to form state. Toast only when the error cannot be tied
 * to a specific input (or contact fieldset).
 */
export function reportStorefrontErrors(
  errors: StorefrontFieldErrors,
  options: {
    setFieldErrors: (errors: StorefrontFieldErrors | ((prev: StorefrontFieldErrors) => StorefrontFieldErrors)) => void;
    toast?: { error: (message: string) => void };
    /** Keys to preserve when patching contact-only errors */
    preserveKeys?: string[];
  },
): void {
  const { setFieldErrors, toast, preserveKeys = [] } = options;

  setFieldErrors((prev) => {
    const next: StorefrontFieldErrors = {};
    for (const key of preserveKeys) {
      if (prev[key]) next[key] = prev[key];
    }
    return { ...next, ...errors };
  });

  const firstField = Object.keys(errors).find(
    (k) => !k.startsWith("_") && errors[k],
  );
  if (firstField) {
    requestAnimationFrame(() => scrollToStorefrontField(firstField));
    return;
  }

  if (errors._contact) {
    requestAnimationFrame(() => scrollToStorefrontField("contact"));
    return;
  }

  const toastMsg = storefrontToastMessage(errors);
  if (toastMsg) toast?.error(toastMsg);
}
