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
import { ADMIN_LOGIN_PATH } from "@/lib/admin/constants";
import { ensureAccessToken } from "@/lib/admin/refresh-access-token";
import {
  clearAdminTokens,
  setAdminTokens,
} from "@/lib/admin/token-storage";
import { registerAuthHandlers } from "@/lib/admin/unauthorized-handler";

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
    registerAuthHandlers({
      onUnauthorized: () => {
        clearAdminTokens();
        setAccessToken(null);
        window.location.assign(ADMIN_LOGIN_PATH);
      },
      onTokenRefreshed: (token) => setAccessToken(token),
    });

    void ensureAccessToken().then((token) => {
      setAccessToken(token);
      setReady(true);
    });

    return () => registerAuthHandlers(null);
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
