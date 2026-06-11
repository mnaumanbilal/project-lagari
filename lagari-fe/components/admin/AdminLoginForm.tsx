"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LagariLogo } from "@/components/brand/LagariLogo";
import { ADMIN_DASHBOARD_PATH } from "@/lib/admin/constants";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { getValidAccessToken } from "@/lib/admin/token-storage";
import { ApiError } from "@/lib/api/client";
import { useAdminToast } from "@/lib/admin/admin-toast-context";
import { unlockNotificationSound } from "@/lib/admin/notification-sound";

export function AdminLoginForm() {
  const router = useRouter();
  const { login, ready, isAuthenticated } = useAdminAuth();
  const toast = useAdminToast();
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && isAuthenticated && getValidAccessToken()) {
      router.replace(ADMIN_DASHBOARD_PATH);
    }
  }, [ready, isAuthenticated, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    unlockNotificationSound();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      if (!getValidAccessToken()) {
        throw new Error("Sign-in succeeded but session was not saved.");
      }
      router.replace(ADMIN_DASHBOARD_PATH);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Sign-in failed. Try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="flex justify-center">
        <LagariLogo className="h-10 w-auto" />
      </div>
      <h1 className="font-display mt-8 text-center text-2xl font-semibold text-lagari-primary">
        Admin sign in
      </h1>
      <p className="mt-2 text-center text-sm text-lagari-muted">
        Internal access only
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="admin-email" className="text-sm font-medium text-lagari-muted">
            Email
          </label>
          <input
            id="admin-email"
            name="email"
            type="text"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-sm border border-lagari-border bg-lagari-surface px-3 py-2.5 text-lagari-primary outline-none focus:border-lagari-brass"
          />
        </div>
        <div>
          <label
            htmlFor="admin-password"
            className="text-sm font-medium text-lagari-muted"
          >
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-sm border border-lagari-border bg-lagari-surface px-3 py-2.5 text-lagari-primary outline-none focus:border-lagari-brass"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!ready || loading}
          className="admin-btn-primary w-full py-3 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
