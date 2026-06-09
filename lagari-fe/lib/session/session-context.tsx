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

const SESSION_STORAGE_KEY = "lagari_session_id";
const VISITOR_STORAGE_KEY = "lagari_visitor_id";

function getOrCreateVisitorId(): string {
  const existing = localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(VISITOR_STORAGE_KEY, id);
  return id;
}

type SessionContextValue = {
  sessionId: string | null;
  visitorId: string | null;
  ready: boolean;
  ensureSession: () => Promise<string>;
  refreshSession: () => Promise<string>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [ready, setReady] = useState(!USE_API);

  const createAndStoreSession = useCallback(async (): Promise<string> => {
    const vid = getOrCreateVisitorId();
    setVisitorId(vid);
    const session = await createSession(vid);
    if (session.visitorId) {
      localStorage.setItem(VISITOR_STORAGE_KEY, session.visitorId);
      setVisitorId(session.visitorId);
    }
    sessionStorage.setItem(SESSION_STORAGE_KEY, session.id);
    setSessionId(session.id);
    setReady(true);
    return session.id;
  }, []);

  const ensureSession = useCallback(async (): Promise<string> => {
    if (!USE_API) {
      setReady(true);
      return "";
    }

    const vid = getOrCreateVisitorId();
    setVisitorId(vid);

    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        await touchSession(stored);
        setSessionId(stored);
        setReady(true);
        return stored;
      } catch {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }

    return createAndStoreSession();
  }, [createAndStoreSession]);

  const refreshSession = useCallback(async (): Promise<string> => {
    if (!USE_API) return "";
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionId(null);
    return createAndStoreSession();
  }, [createAndStoreSession]);

  useEffect(() => {
    ensureSession().catch(() => {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setSessionId(null);
      setReady(true);
    });
  }, [ensureSession]);

  return (
    <SessionContext.Provider
      value={{ sessionId, visitorId, ready, ensureSession, refreshSession }}
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
