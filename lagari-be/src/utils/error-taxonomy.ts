import { ZodError } from "zod";
import { AppError } from "../middleware/errorHandler";

export type ErrorCategory = "validation" | "business" | "transient" | "internal";

/** Node/system error codes that indicate a transient network/IO failure. */
const TRANSIENT_SYSTEM_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ESOCKETTIMEDOUT",
  "EPIPE",
  "EAI_AGAIN",
  "ENOTFOUND",
]);

const TRANSIENT_HTTP_STATUSES = new Set([502, 503, 504]);

function readString(obj: unknown, key: string): string | undefined {
  const v = (obj as Record<string, unknown> | null)?.[key];
  return typeof v === "string" ? v : undefined;
}

function readNumber(obj: unknown, key: string): number | undefined {
  const v = (obj as Record<string, unknown> | null)?.[key];
  return typeof v === "number" ? v : undefined;
}

/**
 * Whether an error is a transient infrastructure failure that is safe to retry
 * (network blip, dependency 5xx, DB connection hiccup).
 *
 * Intentional 4xx errors (business rules, validation) are NEVER transient.
 */
export function isTransientError(err: unknown): boolean {
  // Intentional client-facing errors: only 5xx is considered transient.
  if (err instanceof AppError) return err.statusCode >= 500;
  if (err instanceof ZodError) return false;

  const code = readString(err, "code");
  if (code && TRANSIENT_SYSTEM_CODES.has(code)) return true;

  // Sequelize wraps connection problems in named error classes.
  const name = readString(err, "name");
  if (name && /Connection.*Error|TimeoutError/.test(name)) return true;

  const httpStatus = readNumber(err, "status") ?? readNumber(err, "statusCode");
  if (httpStatus !== undefined && TRANSIENT_HTTP_STATUSES.has(httpStatus)) {
    return true;
  }

  return false;
}

/** Coarse classification used for logging and retry decisions. */
export function classifyError(err: unknown): ErrorCategory {
  if (err instanceof ZodError) return "validation";
  if (err instanceof AppError) return err.statusCode >= 500 ? "internal" : "business";
  if (isTransientError(err)) return "transient";
  return "internal";
}
