"use client";

import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { AdminAuthProvider } from "@/lib/admin/admin-auth-context";
import { AdminToastProvider } from "@/lib/admin/admin-toast-context";
import { AdminQueryProvider } from "@/components/admin/AdminQueryProvider";

export function AdminProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary scope="admin">
      <AdminAuthProvider>
        <AdminQueryProvider>
          <AdminToastProvider>{children}</AdminToastProvider>
        </AdminQueryProvider>
      </AdminAuthProvider>
    </ErrorBoundary>
  );
}
