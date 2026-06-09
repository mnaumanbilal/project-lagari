/** Client-side JWT expiry check (signature verified only on the API). */
export function isAccessTokenExpired(accessToken: string): boolean {
  try {
    const segment = accessToken.split(".")[1];
    if (!segment) return true;
    const payload = JSON.parse(atob(segment)) as { exp?: number };
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}
