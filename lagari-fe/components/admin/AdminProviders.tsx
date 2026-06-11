"use client";

import type { ReactNode } from "react";
import { AdminAuthProvider } from "@/lib/admin/admin-auth-context";
import { AdminToastProvider } from "@/lib/admin/admin-toast-context";
import { AdminQueryProvider } from "@/components/admin/AdminQueryProvider";

export function AdminProviders({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminQueryProvider>
        <AdminToastProvider>{children}</AdminToastProvider>
      </AdminQueryProvider>
    </AdminAuthProvider>
  );
}
