const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

/** Backend base URL — dev falls back to local Express when unset. */
export const API_BASE_URL =
  rawApiUrl?.replace(/\/$/, "") ?? "http://localhost:4000";

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
 * - No NEXT_PUBLIC_API_URL → dummy catalog (safe for Vercel build before BE is wired).
 * - Loopback URL in production build → dummy (CI/Vercel cannot reach localhost:4000).
 * Set NEXT_PUBLIC_USE_API=false to force dummy data even with a URL set.
 */
export const USE_API =
  process.env.NEXT_PUBLIC_USE_API !== "false" &&
  Boolean(rawApiUrl) &&
  !(process.env.NODE_ENV === "production" && isLoopbackApiUrl(API_BASE_URL));
