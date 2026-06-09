import { isAccessTokenExpired } from "@/lib/admin/token";

const ACCESS_KEY = "lagari_admin_access";
const REFRESH_KEY = "lagari_admin_refresh";

export type AdminTokens = {
  accessToken: string;
  refreshToken: string;
};

/** Read tokens without clearing storage (access may be expired). */
export function readAdminTokens(): AdminTokens | null {
  if (typeof window === "undefined") return null;
  const accessToken = localStorage.getItem(ACCESS_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function getAdminTokens(): AdminTokens | null {
  const tokens = readAdminTokens();
  if (!tokens) return null;
  if (isAccessTokenExpired(tokens.accessToken)) return null;
  return tokens;
}

/** Sync read — valid non-expired access token only (does not refresh). */
export function getValidAccessToken(): string | null {
  return getAdminTokens()?.accessToken ?? null;
}

export function setAdminTokens(tokens: AdminTokens): void {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearAdminTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
