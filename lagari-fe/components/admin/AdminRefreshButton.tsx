"use client";

import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useState } from "react";

type Props = {
  queryKey: QueryKey | QueryKey[];
  label?: string;
  className?: string;
};

export function AdminRefreshButton({
  queryKey,
  label = "Refresh",
  className = "",
}: Props) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const keys = Array.isArray(queryKey[0]) ? (queryKey as QueryKey[]) : [queryKey as QueryKey];

  async function handleRefresh() {
    setRefreshing(true);
    try {
      for (const key of keys) {
        await queryClient.invalidateQueries({ queryKey: key });
        await queryClient.refetchQueries({ queryKey: key, type: "active" });
      }
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleRefresh()}
      disabled={refreshing}
      className={`admin-btn inline-flex h-9 items-center gap-2 rounded-sm border border-lagari-border px-3 text-sm text-lagari-muted transition-colors hover:border-lagari-brass hover:text-lagari-brass disabled:opacity-50 ${className}`}
      aria-label={label}
    >
      <span
        className={`inline-block text-base leading-none ${refreshing ? "animate-spin" : ""}`}
        aria-hidden
      >
        ↻
      </span>
      {label}
    </button>
  );
}

type ToolbarProps = {
  title: string;
  description?: string;
  queryKey: QueryKey | QueryKey[];
  children?: React.ReactNode;
};

export function AdminPageToolbar({
  title,
  description,
  queryKey,
  children,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm text-lagari-muted">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <AdminRefreshButton queryKey={queryKey} />
      </div>
    </div>
  );
}
