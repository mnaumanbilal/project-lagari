"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { API_BASE_URL } from "@/lib/api/config";
import {
  fetchNotificationStreamToken,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationsRead,
  type AdminNotification,
} from "@/lib/api/notifications";
import { useAdminToast } from "@/lib/admin/admin-toast-context";
import {
  isNotificationMuted,
  playNotificationSound,
  setNotificationMuted,
  unlockNotificationSound,
} from "@/lib/admin/notification-sound";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";

type AdminNotificationContextValue = {
  unreadCount: number;
  notifications: AdminNotification[];
  muted: boolean;
  setMuted: (muted: boolean) => void;
  refreshInbox: () => Promise<void>;
  markRead: (ids: string[]) => Promise<void>;
  markAllRead: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loadingInbox: boolean;
};

const AdminNotificationContext =
  createContext<AdminNotificationContextValue | null>(null);

const INBOX_PAGE_SIZE = 20;
const STREAM_TOKEN_REFRESH_MS = 4 * 60 * 1000;
const RECONNECT_DELAY_MS = 5000;

export function AdminNotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, ready } = useAdminAuth();
  const { info: toastInfo } = useAdminToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [muted, setMutedState] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const tokenRefreshTimerRef = useRef<number | null>(null);
  const intentionalCloseRef = useRef(false);
  const reconnectPendingRef = useRef(false);
  /** IDs we've already shown toast/sound for this browser session */
  const alertedIdsRef = useRef(new Set<string>());
  const toastInfoRef = useRef(toastInfo);
  toastInfoRef.current = toastInfo;

  const setMuted = useCallback((value: boolean) => {
    setMutedState(value);
    setNotificationMuted(value);
  }, []);

  useEffect(() => {
    setMutedState(isNotificationMuted());
  }, []);

  const alertOnce = useCallback((notification: AdminNotification) => {
    if (alertedIdsRef.current.has(notification.id)) return;
    alertedIdsRef.current.add(notification.id);
    if (!isNotificationMuted()) playNotificationSound();
    toastInfoRef.current(notification.title);
  }, []);

  const seedAlertedIds = useCallback((items: AdminNotification[]) => {
    for (const item of items) {
      alertedIdsRef.current.add(item.id);
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await fetchUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      /* ignore when logged out */
    }
  }, []);

  const refreshInbox = useCallback(async () => {
    setLoadingInbox(true);
    try {
      const res = await fetchNotifications({ page: 1, limit: INBOX_PAGE_SIZE });
      seedAlertedIds(res.notifications);
      setNotifications(res.notifications);
      setPage(1);
      setTotal(res.total);
      await refreshUnreadCount();
    } finally {
      setLoadingInbox(false);
    }
  }, [refreshUnreadCount, seedAlertedIds]);

  const loadMore = useCallback(async () => {
    if (notifications.length >= total) return;
    const nextPage = page + 1;
    const res = await fetchNotifications({
      page: nextPage,
      limit: INBOX_PAGE_SIZE,
    });
    seedAlertedIds(res.notifications);
    setNotifications((prev) => [...prev, ...res.notifications]);
    setPage(nextPage);
    setTotal(res.total);
  }, [notifications.length, page, total, seedAlertedIds]);

  const markRead = useCallback(async (ids: string[]) => {
    const res = await markNotificationsRead({ ids });
    setUnreadCount(res.unreadCount);
    setNotifications((prev) =>
      prev.map((n) =>
        ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
  }, []);

  const markAllRead = useCallback(async () => {
    const res = await markNotificationsRead({ all: true });
    setUnreadCount(res.unreadCount);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );
  }, []);

  const closeStream = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (eventSourceRef.current) {
      intentionalCloseRef.current = true;
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connectStreamRef = useRef<() => Promise<void>>(async () => {});

  connectStreamRef.current = async () => {
    if (!isAuthenticated) return;

    closeStream();

    try {
      const { token } = await fetchNotificationStreamToken();
      const url = `${API_BASE_URL}/admin/notifications/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;
      intentionalCloseRef.current = false;

      es.addEventListener("connected", () => {
        unlockNotificationSound();
        reconnectPendingRef.current = false;
      });

      es.addEventListener("notification", (event) => {
        try {
          const notification = JSON.parse(
            (event as MessageEvent).data,
          ) as AdminNotification;
          alertOnce(notification);
          void refreshUnreadCount();
          setNotifications((prev) => {
            if (prev.some((n) => n.id === notification.id)) return prev;
            return [notification, ...prev].slice(0, INBOX_PAGE_SIZE);
          });
        } catch {
          /* ignore */
        }
      });

      es.onerror = () => {
        if (intentionalCloseRef.current) {
          intentionalCloseRef.current = false;
          return;
        }
        closeStream();
        if (reconnectPendingRef.current) return;
        reconnectPendingRef.current = true;
        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectPendingRef.current = false;
          void connectStreamRef.current();
          void refreshUnreadCount();
        }, RECONNECT_DELAY_MS);
      };
    } catch {
      if (reconnectPendingRef.current) return;
      reconnectPendingRef.current = true;
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectPendingRef.current = false;
        void connectStreamRef.current();
      }, RECONNECT_DELAY_MS);
    }
  };

  useEffect(() => {
    if (!ready || !isAuthenticated) {
      closeStream();
      if (tokenRefreshTimerRef.current) {
        window.clearInterval(tokenRefreshTimerRef.current);
        tokenRefreshTimerRef.current = null;
      }
      return;
    }

    void (async () => {
      await refreshInbox();
      await connectStreamRef.current();
    })();

    tokenRefreshTimerRef.current = window.setInterval(() => {
      void connectStreamRef.current();
    }, STREAM_TOKEN_REFRESH_MS);

    return () => {
      closeStream();
      if (tokenRefreshTimerRef.current) {
        window.clearInterval(tokenRefreshTimerRef.current);
        tokenRefreshTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- connect once per auth session
  }, [ready, isAuthenticated]);

  const value = useMemo(
    () => ({
      unreadCount,
      notifications,
      muted,
      setMuted,
      refreshInbox,
      markRead,
      markAllRead,
      loadMore,
      hasMore: notifications.length < total,
      loadingInbox,
    }),
    [
      unreadCount,
      notifications,
      muted,
      setMuted,
      refreshInbox,
      markRead,
      markAllRead,
      loadMore,
      total,
      loadingInbox,
    ],
  );

  return (
    <AdminNotificationContext.Provider value={value}>
      {children}
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotifications(): AdminNotificationContextValue {
  const ctx = useContext(AdminNotificationContext);
  if (!ctx) {
    throw new Error("useAdminNotifications must be used within AdminNotificationProvider");
  }
  return ctx;
}
