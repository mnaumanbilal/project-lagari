function readJwtExpiry(token: string): number | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const payload = JSON.parse(atob(segment)) as { exp?: number };
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

/** Client-side JWT expiry check (signature verified only on the API). */
export function isAccessTokenExpired(accessToken: string): boolean {
  const exp = readJwtExpiry(accessToken);
  if (!exp) return true;
  // Refresh one minute before expiry to avoid race with in-flight requests.
  return Date.now() >= exp * 1000 - 60_000;
}

export function isRefreshTokenExpired(refreshToken: string): boolean {
  const exp = readJwtExpiry(refreshToken);
  if (!exp) return true;
  return Date.now() >= exp * 1000;
}
