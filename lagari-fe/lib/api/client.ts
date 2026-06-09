import { API_BASE_URL } from "./config";
import type { ApiErrorPayload } from "./errors";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public payload?: ApiErrorPayload,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & {
    sessionId?: string;
    accessToken?: string;
    cache?: RequestCache;
    next?: NextFetchRequestConfig;
  },
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  if (init?.sessionId) {
    headers.set("X-Session-Id", init.sessionId);
  }
  if (init?.accessToken) {
    headers.set("Authorization", `Bearer ${init.accessToken}`);
  }

  const {
    sessionId: _sessionId,
    accessToken: _accessToken,
    ...fetchInit
  } = init ?? {};

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchInit,
    headers,
  });

  if (!res.ok) {
    let message = res.statusText;
    let payload: ApiErrorPayload | undefined;
    try {
      const body = (await res.json()) as ApiErrorPayload;
      payload = body;
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message, payload);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiHealth(): Promise<{ status: string }> {
  return apiFetch("/health");
}
