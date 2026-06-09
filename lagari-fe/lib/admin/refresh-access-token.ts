import { ApiError } from "@/lib/api/client";
import { adminRefreshToken } from "@/lib/api/auth";
import { isAccessTokenExpired, isRefreshTokenExpired } from "@/lib/admin/token";
import {
  clearAdminTokens,
  readAdminTokens,
  setAdminTokens,
} from "@/lib/admin/token-storage";
import { notifyTokenRefreshed, notifyUnauthorized } from "@/lib/admin/unauthorized-handler";

let refreshInFlight: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const tokens = readAdminTokens();
    if (!tokens || isRefreshTokenExpired(tokens.refreshToken)) {
      clearAdminTokens();
      return null;
    }

    try {
      const next = await adminRefreshToken(tokens.refreshToken);
      setAdminTokens(next);
      notifyTokenRefreshed(next.accessToken);
      return next.accessToken;
    } catch {
      clearAdminTokens();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Returns a valid access token, refreshing silently when only the access JWT expired. */
export async function ensureAccessToken(): Promise<string | null> {
  const tokens = readAdminTokens();
  if (!tokens) return null;

  if (!isAccessTokenExpired(tokens.accessToken)) {
    return tokens.accessToken;
  }

  if (isRefreshTokenExpired(tokens.refreshToken)) {
    clearAdminTokens();
    return null;
  }

  return refreshAccessToken();
}

export async function handleAdminUnauthorized(): Promise<never> {
  clearAdminTokens();
  notifyUnauthorized();
  throw new ApiError(401, "Admin session expired");
}
