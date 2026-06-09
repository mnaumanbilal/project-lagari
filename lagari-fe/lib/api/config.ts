/** Backend base URL — set in .env or .env.local */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:4000";

/**
 * Use lagari-be when API URL is set. Set NEXT_PUBLIC_USE_API=false to force dummy data.
 */
export const USE_API = process.env.NEXT_PUBLIC_USE_API !== "false";
