import { apiFetch } from "./client";

export type SessionResponse = {
  id: string;
  visitorId: string | null;
  expiresAt: string;
};

export async function createSession(visitorId?: string): Promise<SessionResponse> {
  return apiFetch<SessionResponse>("/sessions", {
    method: "POST",
    body: JSON.stringify(visitorId ? { visitorId } : {}),
    cache: "no-store",
  });
}

/** Returns 204 when the session is active; 401 when expired or unknown. */
export async function touchSession(sessionId: string): Promise<void> {
  await apiFetch<void>(`/sessions/${sessionId}/touch`, {
    method: "POST",
    cache: "no-store",
  });
}
