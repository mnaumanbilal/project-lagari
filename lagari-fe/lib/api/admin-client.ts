import { API_BASE_URL } from "./config";
import { ApiError, apiFetch } from "./client";
import { isAccessTokenExpired } from "@/lib/admin/token";
import {
  ensureAccessToken,
  handleAdminUnauthorized,
  refreshAccessToken,
} from "@/lib/admin/refresh-access-token";

type AdminFetchInit = RequestInit & {
  accessToken?: string;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
};

async function resolveToken(explicit?: string): Promise<string | null> {
  if (explicit && !isAccessTokenExpired(explicit)) return explicit;
  return ensureAccessToken();
}

/**
 * Admin API wrapper: attaches Bearer token, silently refreshes on expiry,
 * retries once on 401, then signs the admin out.
 */
export async function adminApiFetch<T>(
  path: string,
  init?: AdminFetchInit,
): Promise<T> {
  let token = await resolveToken(init?.accessToken);
  if (!token) {
    await handleAdminUnauthorized();
  }

  try {
    return await apiFetch<T>(path, { ...init, accessToken: token! });
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err;

    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      await handleAdminUnauthorized();
    }

    return apiFetch<T>(path, { ...init, accessToken: refreshed! });
  }
}

/** For multipart / non-JSON admin requests (e.g. image upload). */
export async function adminAuthorizedFetch(
  path: string,
  init: RequestInit,
  explicitToken?: string,
): Promise<Response> {
  let token = await resolveToken(explicitToken);
  if (!token) {
    await handleAdminUnauthorized();
  }

  const request = (accessToken: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: withBearer(init.headers, accessToken),
    });

  let res = await request(token!);
  if (res.status !== 401) return res;

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    await handleAdminUnauthorized();
  }

  res = await request(refreshed!);
  if (res.status === 401) {
    await handleAdminUnauthorized();
  }
  return res;
}

function withBearer(headers: HeadersInit | undefined, accessToken: string): Headers {
  const next = new Headers(headers);
  next.set("Authorization", `Bearer ${accessToken}`);
  return next;
}
