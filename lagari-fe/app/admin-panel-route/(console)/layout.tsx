"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/constants";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { getValidAccessToken } from "@/lib/admin/token-storage";

export default function AdminConsoleLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { ready, isAuthenticated } = useAdminAuth();

  useEffect(() => {
    if (!ready) return;
    const token = getValidAccessToken();
    if (!isAuthenticated || !token) {
      router.replace(ADMIN_LOGIN_PATH);
    }
  }, [ready, isAuthenticated, router]);

  if (!ready || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-lagari-muted">
        Loading admin…
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
