"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminLogin } from "@/lib/api/auth";
import {
  clearAdminTokens,
  getValidAccessToken,
  setAdminTokens,
} from "@/lib/admin/token-storage";

type AdminAuthContextValue = {
  ready: boolean;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    setAccessToken(getValidAccessToken());
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    clearAdminTokens();
    const tokens = await adminLogin(email, password);
    setAdminTokens(tokens);
    setAccessToken(tokens.accessToken);
  }, []);

  const logout = useCallback(() => {
    clearAdminTokens();
    setAccessToken(null);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      accessToken,
      isAuthenticated: Boolean(accessToken),
      login,
      logout,
    }),
    [ready, accessToken, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
}
