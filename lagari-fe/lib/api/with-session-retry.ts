import { ApiError } from "./client";

/** Run an API call with a session id; refresh once on 401 and retry. */
export async function withSessionRetry<T>(
  ensureSession: () => Promise<string>,
  refreshSession: () => Promise<string>,
  op: (sessionId: string) => Promise<T>,
): Promise<T> {
  let sessionId = await ensureSession();
  try {
    return await op(sessionId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      sessionId = await refreshSession();
      return op(sessionId);
    }
    throw err;
  }
}
