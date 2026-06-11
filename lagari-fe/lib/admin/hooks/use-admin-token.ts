"use client";

import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { getValidAccessToken } from "@/lib/admin/token-storage";

/** Resolves a valid admin access token from storage or auth context. */
export function useAdminToken(): string | null {
  const { accessToken } = useAdminAuth();
  return getValidAccessToken() ?? accessToken;
}
