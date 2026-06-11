import { adminApiFetch } from "./admin-client";

export type AdminNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  linkPath: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
  readAt?: string | null;
};

export async function fetchNotificationStreamToken(): Promise<{
  token: string;
  expiresInSeconds: number;
}> {
  return adminApiFetch("/admin/notifications/stream-token", { method: "POST" });
}

export async function fetchNotifications(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<{
  notifications: AdminNotification[];
  total: number;
  page: number;
  limit: number;
}> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.unreadOnly) search.set("unreadOnly", "true");
  const qs = search.toString();
  return adminApiFetch(`/admin/notifications${qs ? `?${qs}` : ""}`);
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const res = await adminApiFetch<{ count: number }>(
    "/admin/notifications/unread-count",
  );
  return res.count;
}

export async function markNotificationsRead(input: {
  ids?: string[];
  all?: boolean;
}): Promise<{ updated: number; unreadCount: number }> {
  return adminApiFetch("/admin/notifications/read", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
