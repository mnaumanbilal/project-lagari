"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { AdminNotificationProvider } from "@/lib/admin/admin-notification-context";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/constants";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { getValidAccessToken, readAdminTokens } from "@/lib/admin/token-storage";

export default function AdminConsoleLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { ready, isAuthenticated } = useAdminAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const token = getValidAccessToken();
    if (!isAuthenticated || !token) {
      router.replace(ADMIN_LOGIN_PATH);
    }
  }, [ready, isAuthenticated, router]);

  if (!ready) {
    if (!mounted) {
      return (
        <div className="flex min-h-screen items-center justify-center text-lagari-muted">
          Loading admin…
        </div>
      );
    }

    if (readAdminTokens()) {
      return (
        <AdminShell>
          <AdminLoading />
        </AdminShell>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center text-lagari-muted">
        Loading admin…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-lagari-muted">
        Loading admin…
      </div>
    );
  }

  return (
    <AdminNotificationProvider>
      <AdminShell>{children}</AdminShell>
    </AdminNotificationProvider>
  );
}
