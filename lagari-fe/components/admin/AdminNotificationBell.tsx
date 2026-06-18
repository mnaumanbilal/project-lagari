"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAdminNotifications } from "@/lib/admin/admin-notification-context";
import { formatNotificationWhen } from "@/lib/format";

export function AdminNotificationBell() {
  const {
    unreadCount,
    notifications,
    muted,
    setMuted,
    setPanelOpen,
    isHighlighted,
    markRead,
    markAllRead,
    loadMore,
    hasMore,
    loadingInbox,
    refreshInbox,
  } = useAdminNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPanelOpen(open);
  }, [open, setPanelOpen]);

  useEffect(() => {
    if (!open) return;
    void refreshInbox();
  }, [open, refreshInbox]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div className="relative flex items-center gap-1" ref={panelRef}>
      <button
        type="button"
        onClick={() => setMuted(!muted)}
        className={`rounded-md p-2 transition-colors ${
          muted
            ? "text-lagari-brass bg-lagari-brass/10"
            : "text-lagari-muted hover:bg-lagari-elevated hover:text-lagari-brass"
        }`}
        aria-label={muted ? "Unmute notification sounds" : "Mute notification sounds"}
        title={muted ? "Unmute sounds" : "Mute sounds"}
      >
        {muted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative rounded-md p-2 transition-colors ${
          open
            ? "bg-lagari-elevated text-lagari-brass"
            : "text-lagari-muted hover:bg-lagari-elevated hover:text-lagari-brass"
        }`}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden
        >
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {muted ? (
          <span
            className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-lagari-brass"
            aria-hidden
          />
        ) : null}
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-lagari-brass px-1 text-[10px] font-semibold text-lagari-deep">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-lagari-deep/60 sm:hidden"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-4 right-4 top-14 z-50 isolate overflow-hidden rounded-lg border border-lagari-border bg-lagari-surface shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(22rem,calc(100vw-2rem))]">
          <div className="flex items-center justify-between border-b border-lagari-border px-4 py-3">
            <p className="text-sm font-semibold text-lagari-primary">Notifications</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMuted(!muted)}
                className="text-xs font-medium text-lagari-muted hover:text-lagari-brass"
                title={muted ? "Unmute sounds" : "Mute sounds"}
              >
                {muted ? "Unmute" : "Mute"}
              </button>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="text-xs font-medium text-lagari-brass hover:text-lagari-primary"
                >
                  Mark all read
                </button>
              ) : null}
            </div>
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {loadingInbox && notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-lagari-muted">
                Loading…
              </li>
            ) : null}
            {!loadingInbox && notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-lagari-muted">
                No notifications yet
              </li>
            ) : null}
            {notifications.map((n) => {
              const unread = !n.readAt;
              const highlight = isHighlighted(n.id, n.readAt);
              const rowClass = highlight
                ? "border-l-2 border-l-lagari-brass bg-lagari-brass/10"
                : unread
                  ? "bg-lagari-elevated/40"
                  : "";
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-lagari-primary">{n.title}</p>
                    {unread ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-lagari-brass" aria-hidden />
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-lagari-muted line-clamp-2">{n.body}</p>
                  <p className="mt-1 text-[10px] text-lagari-brass-dim">
                    {formatNotificationWhen(n.createdAt)}
                  </p>
                </>
              );
              return (
                <li
                  key={n.id}
                  className={`border-b border-lagari-border/60 px-4 py-3 last:border-0 ${rowClass}`}
                >
                  <div className="flex flex-col gap-2">
                    {n.linkPath ? (
                      <Link
                        href={n.linkPath}
                        className="block"
                        onClick={() => {
                          if (unread) void markRead([n.id]);
                          setOpen(false);
                        }}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div>{inner}</div>
                    )}
                    {unread ? (
                      <button
                        type="button"
                        onClick={() => void markRead([n.id])}
                        className="self-start text-xs font-medium text-lagari-brass hover:text-lagari-primary"
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          {hasMore ? (
            <div className="border-t border-lagari-border px-4 py-2">
              <button
                type="button"
                onClick={() => void loadMore()}
                className="w-full py-2 text-xs font-medium text-lagari-brass hover:text-lagari-primary"
              >
                Load more
              </button>
            </div>
          ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
