"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { LagariLogo } from "@/components/brand/LagariLogo";
import { AdminNav } from "@/components/admin/AdminNav";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/constants";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { logout } = useAdminAuth();

  function handleLogout() {
    logout();
    router.replace(ADMIN_LOGIN_PATH);
  }

  return (
    <div className="min-h-screen w-full">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-56 shrink-0 border-r border-lagari-border bg-lagari-elevated/50 px-4 py-8 md:block">
          <LagariLogo className="h-7 w-auto" />
          <p className="mt-1 text-xs font-medium text-lagari-brass-dim">Admin</p>
          <div className="mt-8">
            <AdminNav />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-lagari-border bg-lagari-surface/80 px-4 py-4 backdrop-blur-sm sm:px-6">
            <div className="md:hidden">
              <LagariLogo className="h-6 w-auto" />
            </div>
            <div className="flex items-center gap-4 md:ml-auto">
              <Link
                href="/"
                className="text-sm font-medium text-lagari-muted transition-colors hover:text-lagari-brass"
              >
                Storefront
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-lagari-brass transition-colors hover:text-lagari-primary"
              >
                Sign out
              </button>
            </div>
          </header>

          <div className="border-b border-lagari-border bg-lagari-elevated/30 px-4 py-3 md:hidden">
            <AdminNav />
          </div>

          <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
