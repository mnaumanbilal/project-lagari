type AppEnv = "development" | "production";

/** Next.js only inlines NEXT_PUBLIC_* on static `process.env.VAR` access — not `process.env[name]`. */
function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

/**
 * Single mode switch for API URL resolution.
 * Set NEXT_PUBLIC_APP_ENV=production | development
 *
 * Next.js load order (highest wins): .env.local > .env
 */
export const APP_ENV: AppEnv =
  trimEnv(process.env.NEXT_PUBLIC_APP_ENV) === "production" ||
  trimEnv(process.env.NEXT_PUBLIC_NODE_ENV) === "production"
    ? "production"
    : "development";

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * API base URL by APP_ENV:
 * - production  → NEXT_PUBLIC_PROD_API_URL (legacy: PROD_SITE_URL, API_URL)
 * - development → NEXT_PUBLIC_DEV_API_URL (legacy: DEV_SITE_URL, API_URL)
 */
function resolveApiUrl(): string {
  if (APP_ENV === "production") {
    const url =
      trimEnv(process.env.NEXT_PUBLIC_PROD_API_URL) ??
      trimEnv(process.env.NEXT_PUBLIC_PROD_SITE_URL) ??
      trimEnv(process.env.NEXT_PUBLIC_API_URL);
    return url ? normalizeUrl(url) : "";
  }

  const url =
    trimEnv(process.env.NEXT_PUBLIC_DEV_API_URL) ??
    trimEnv(process.env.NEXT_PUBLIC_DEV_SITE_URL) ??
    trimEnv(process.env.NEXT_PUBLIC_API_URL) ??
    "http://localhost:4000";

  return normalizeUrl(url);
}

const rawApiUrl = resolveApiUrl();

/** Backend base URL for lagari-be. */
export const API_BASE_URL =
  APP_ENV === "production" ? rawApiUrl : rawApiUrl || "http://localhost:4000";

/**
 * Use lagari-be when a real API URL is configured.
 * Set NEXT_PUBLIC_USE_API=false to force dummy catalog in local dev only.
 */
export const USE_API =
  process.env.NEXT_PUBLIC_USE_API !== "false" && Boolean(rawApiUrl);

/** Placeholder catalog for local dev when the API is off — never in production. */
export const USE_DUMMY_CATALOG = APP_ENV === "development" && !USE_API;
