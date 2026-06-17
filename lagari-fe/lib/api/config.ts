type AppEnv = "development" | "production";

/**
 * Resolved API environment.
 * NODE_ENV=production (Vercel build + runtime) always uses production URL —
 * even if NEXT_PUBLIC_NODE_ENV=development was copied from local .env.
 */
export const APP_ENV: AppEnv =
  process.env.NODE_ENV === "production"
    ? "production"
    : process.env.NEXT_PUBLIC_NODE_ENV?.trim() === "production"
      ? "production"
      : "development";

function trimEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

/**
 * API base URL by environment:
 * - production → NEXT_PUBLIC_PROD_SITE_URL, then NEXT_PUBLIC_API_URL
 * - development → NEXT_PUBLIC_DEV_SITE_URL, then NEXT_PUBLIC_API_URL, then localhost
 */
function resolveApiUrl(): string {
  if (APP_ENV === "production") {
    return (
      trimEnv("NEXT_PUBLIC_PROD_SITE_URL") ??
      trimEnv("NEXT_PUBLIC_API_URL") ??
      ""
    );
  }

  return (
    trimEnv("NEXT_PUBLIC_DEV_SITE_URL") ??
    trimEnv("NEXT_PUBLIC_API_URL") ??
    "http://localhost:4000"
  );
}

const rawApiUrl = resolveApiUrl();

/** Backend base URL for lagari-be. */
export const API_BASE_URL = rawApiUrl.replace(/\/$/, "") || "http://localhost:4000";

function isLoopbackApiUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

/**
 * Use lagari-be when a real API URL is configured.
 * Loopback URL in production → off (Vercel build cannot reach localhost).
 * Set NEXT_PUBLIC_USE_API=false to force dummy data in local dev only.
 */
export const USE_API =
  process.env.NEXT_PUBLIC_USE_API !== "false" &&
  Boolean(rawApiUrl) &&
  !(APP_ENV === "production" && isLoopbackApiUrl(API_BASE_URL));

/** Placeholder catalog for local dev when the API is off — never shown in production. */
export const USE_DUMMY_CATALOG = APP_ENV === "development" && !USE_API;
