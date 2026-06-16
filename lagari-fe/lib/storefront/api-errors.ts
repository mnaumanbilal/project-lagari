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

/** Parse HTTP error responses (4xx/5xx) into field-level errors where possible. */
export function parseStorefrontApiError(err: unknown): StorefrontFieldErrors {
  if (!(err instanceof ApiError)) {
    return { _form: "Something went wrong. Please try again." };
  }

  const fromPayload = mapApiFieldKeys(parseValidationPayload(err.payload ?? {}));
  if (Object.keys(fromPayload).length > 0) return fromPayload;

  const inferred = inferFieldFromMessage(err.message);
  if (inferred) return { [inferred]: err.message };

  return { _form: err.message || "Something went wrong. Please try again." };
}

/** Map a 200 OK eligibility failure into field errors. */
export function eligibilityToFieldErrors(
  result: Extract<ReviewEligibilityResult, { canSubmit: false }>,
): StorefrontFieldErrors {
  if (result.field === "phone") return { contactPhone: result.message };
  if (result.field === "email") return { contactEmail: result.message };
  if (result.field === "contact") return { _contact: result.message };

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
      return { _contact: result.message };
    case "limit_reached":
      return { _form: result.message };
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
