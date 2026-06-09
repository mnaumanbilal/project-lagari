"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { USE_API } from "@/lib/api/config";
import { createSession, touchSession } from "@/lib/api/session";

const STORAGE_KEY = "lagari_session_id";

type SessionContextValue = {
  sessionId: string | null;
  ready: boolean;
  /** Validate stored session or create a new one; returns active session id. */
  ensureSession: () => Promise<string>;
  /** Discard current session and create a fresh one. */
  refreshSession: () => Promise<string>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ready, setReady] = useState(!USE_API);

  const createAndStoreSession = useCallback(async (): Promise<string> => {
    const session = await createSession();
    sessionStorage.setItem(STORAGE_KEY, session.id);
    setSessionId(session.id);
    setReady(true);
    return session.id;
  }, []);

  const ensureSession = useCallback(async (): Promise<string> => {
    if (!USE_API) {
      setReady(true);
      return "";
    }

    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        await touchSession(stored);
        setSessionId(stored);
        setReady(true);
        return stored;
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }

    return createAndStoreSession();
  }, [createAndStoreSession]);

  const refreshSession = useCallback(async (): Promise<string> => {
    if (!USE_API) return "";
    sessionStorage.removeItem(STORAGE_KEY);
    setSessionId(null);
    return createAndStoreSession();
  }, [createAndStoreSession]);

  useEffect(() => {
    ensureSession().catch(() => {
      sessionStorage.removeItem(STORAGE_KEY);
      setSessionId(null);
      setReady(true);
    });
  }, [ensureSession]);

  return (
    <SessionContext.Provider
      value={{ sessionId, ready, ensureSession, refreshSession }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
