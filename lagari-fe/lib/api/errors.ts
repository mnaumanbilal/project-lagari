/** Structured API error body from lagari-be */
export type ApiIssue = { path: string; message: string };

export type ApiErrorPayload = {
  error?: string;
  details?: Record<string, string[] | unknown>;
  issues?: ApiIssue[];
};

export function issuesToFieldErrors(issues: ApiIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Flatten Zod fieldErrors + issues into `field → message` map */
export function parseValidationPayload(payload: ApiErrorPayload): Record<string, string> {
  const out: Record<string, string> = {};

  if (payload.issues?.length) {
    Object.assign(out, issuesToFieldErrors(payload.issues));
  }

  if (payload.details) {
    for (const [key, val] of Object.entries(payload.details)) {
      if (Array.isArray(val) && typeof val[0] === "string") {
        if (!out[key]) out[key] = val[0];
      }
    }
  }

  return out;
}

/** Map API / business errors to a primary form field when possible */
export function inferFieldFromMessage(
  message: string,
  status: number,
): string | null {
  const lower = message.toLowerCase();
  if (status === 409 && lower.includes("slug")) return "slug";
  if (lower.includes("sku")) return "variants.0.sku";
  if (lower.includes("category")) return "categorySlugs";
  if (lower.includes("note tag")) return "noteTagSlugs";
  return null;
}
