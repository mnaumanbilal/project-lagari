"use client";

import type { ReactNode } from "react";
import { AdminAuthProvider } from "@/lib/admin/admin-auth-context";
import { AdminToastProvider } from "@/lib/admin/admin-toast-context";

export function AdminProviders({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminToastProvider>{children}</AdminToastProvider>
    </AdminAuthProvider>
  );
}
