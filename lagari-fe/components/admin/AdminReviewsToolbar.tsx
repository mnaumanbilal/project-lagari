"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ADMIN_FILTER_DEBOUNCE_MS } from "@/lib/admin/debounce";
import { useDebouncedCommit } from "@/lib/hooks/use-debounced-commit";
import type { FetchAdminReviewsParams } from "@/lib/api/admin";

export type ReviewToolbarState = {
  tab: "all" | "pending";
  productSearch: string;
  datePreset: "all" | "7d" | "30d";
  sort: NonNullable<FetchAdminReviewsParams["sort"]>;
  ratingBand: "all" | "low" | "mid" | "high";
};

function parseState(search: URLSearchParams): ReviewToolbarState {
  const statusRaw = search.get("status");
  const tab =
    statusRaw === "pending"
      ? "pending"
      : "all";
  const datePreset =
    search.get("date") === "7d"
      ? "7d"
      : search.get("date") === "30d"
        ? "30d"
        : "all";
  const sortRaw = search.get("sort");
  const sort =
    sortRaw === "oldest" ||
    sortRaw === "rating_high" ||
    sortRaw === "rating_low"
      ? sortRaw
      : "newest";
  const ratingBandRaw = search.get("rating");
  const ratingBand =
    ratingBandRaw === "low" ||
    ratingBandRaw === "mid" ||
    ratingBandRaw === "high"
      ? ratingBandRaw
      : "all";

  const productSearch =
    search.get("product") ??
    search.get("productSearch") ??
    search.get("productSlug") ??
    "";

  return {
    tab,
    productSearch,
    datePreset,
    sort,
    ratingBand,
  };
}

function stateToSearchParams(state: ReviewToolbarState): URLSearchParams {
  const q = new URLSearchParams();
  if (state.tab === "pending") q.set("status", "pending");
  const product = state.productSearch.trim();
  if (product) q.set("product", product);
  if (state.datePreset !== "all") q.set("date", state.datePreset);
  if (state.ratingBand !== "all") q.set("rating", state.ratingBand);
  if (state.sort !== "newest") q.set("sort", state.sort);
  return q;
}

function dateRangeFromPreset(preset: ReviewToolbarState["datePreset"]): {
  from?: string;
  to?: string;
} {
  if (preset === "all") return {};
  const days = preset === "7d" ? 7 : 30;
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: new Date().toISOString() };
}

function ratingFromBand(band: ReviewToolbarState["ratingBand"]): {
  ratingMin?: number;
  ratingMax?: number;
} {
  switch (band) {
    case "low":
      return { ratingMin: 1, ratingMax: 2 };
    case "mid":
      return { ratingMin: 3, ratingMax: 3 };
    case "high":
      return { ratingMin: 4, ratingMax: 5 };
    default:
      return {};
  }
}

export function reviewToolbarToFetchParams(
  state: ReviewToolbarState,
  page = 1,
): FetchAdminReviewsParams {
  const productSearch = state.productSearch.trim();
  return {
    status: state.tab === "pending" ? "pending" : "all",
    productSearch: productSearch || undefined,
    sort: state.sort,
    page,
    limit: 25,
    ...dateRangeFromPreset(state.datePreset),
    ...ratingFromBand(state.ratingBand),
  };
}

type Props = {
  state: ReviewToolbarState;
  onChange: (next: ReviewToolbarState) => void;
  onPatch: (patch: Partial<ReviewToolbarState>) => void;
  pendingCount?: number;
  publishedCount?: number;
};

const REVIEW_TABS = [
  { id: "all" as const, label: "All reviews" },
  { id: "pending" as const, label: "Pending" },
];

function AdminReviewTabs({
  tab,
  pendingCount,
  publishedCount,
  onSelect,
}: {
  tab: ReviewToolbarState["tab"];
  pendingCount?: number;
  publishedCount?: number;
  onSelect: (tab: ReviewToolbarState["tab"]) => void;
}) {
  const counts: Record<ReviewToolbarState["tab"], number | undefined> = {
    all: publishedCount != null && pendingCount != null
      ? publishedCount + pendingCount
      : undefined,
    pending: pendingCount,
  };

  return (
    <div
      role="tablist"
      aria-label="Review queues"
      className="flex gap-1 border-b border-lagari-border"
    >
      {REVIEW_TABS.map(({ id, label }) => {
        const selected = tab === id;
        const count = counts[id];
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(id)}
            className={`admin-btn -mb-px rounded-t-sm border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              selected
                ? "border-lagari-brass text-lagari-primary"
                : "border-transparent text-lagari-muted hover:text-lagari-primary"
            }`}
          >
            {label}
            {count != null && count > 0 ? (
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs tabular-nums ${
                  id === "pending" && count > 0
                    ? "bg-lagari-brass/20 text-lagari-brass"
                    : "bg-lagari-elevated text-lagari-muted"
                }`}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function DebouncedProductSearchField({
  committed,
  onCommit,
}: {
  committed: string;
  onCommit: (value: string) => void;
}) {
  const { draft, setDraft, isDebouncing } = useDebouncedCommit(
    committed,
    onCommit,
    ADMIN_FILTER_DEBOUNCE_MS,
  );

  return (
    <label className="block text-sm">
      <span className="font-medium text-lagari-muted">Product</span>
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Search by name or slug…"
        autoComplete="off"
        className="admin-input mt-1.5 w-full px-3 py-2"
      />
      {isDebouncing ? (
        <p className="mt-1 text-xs text-lagari-muted">Searching…</p>
      ) : (
        <p className="mt-1 text-xs text-lagari-muted">
          Matches product title or slug (partial, case-insensitive).
        </p>
      )}
    </label>
  );
}

export function AdminReviewsToolbar({
  state,
  onChange,
  onPatch,
  pendingCount,
  publishedCount,
}: Props) {
  const commitProductSearch = useCallback(
    (productSearch: string) => {
      onPatch({ productSearch });
    },
    [onPatch],
  );

  const hasFilters =
    state.productSearch.trim() !== "" ||
    state.datePreset !== "all" ||
    state.ratingBand !== "all" ||
    state.sort !== "newest";

  return (
    <div className="admin-card mt-6 overflow-hidden">
      <div className="border-b border-lagari-border/80 px-4 pt-2">
        <AdminReviewTabs
          tab={state.tab}
          pendingCount={pendingCount}
          publishedCount={publishedCount}
          onSelect={(tab) => onChange({ ...state, tab })}
        />
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DebouncedProductSearchField
          committed={state.productSearch}
          onCommit={commitProductSearch}
        />
        <label className="block text-sm">
          <span className="font-medium text-lagari-muted">Submitted</span>
          <select
            value={state.datePreset}
            onChange={(e) =>
              onChange({
                ...state,
                datePreset: e.target.value as ReviewToolbarState["datePreset"],
              })
            }
            className="admin-input mt-1.5 w-full px-3 py-2"
          >
            <option value="all">All time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-lagari-muted">Rating</span>
          <select
            value={state.ratingBand}
            onChange={(e) =>
              onChange({
                ...state,
                ratingBand: e.target.value as ReviewToolbarState["ratingBand"],
              })
            }
            className="admin-input mt-1.5 w-full px-3 py-2"
          >
            <option value="all">All ratings</option>
            <option value="low">Low (1–2★)</option>
            <option value="mid">Mid (3★)</option>
            <option value="high">High (4–5★)</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-lagari-muted">Sort</span>
          <select
            value={state.sort}
            onChange={(e) =>
              onChange({
                ...state,
                sort: e.target.value as ReviewToolbarState["sort"],
              })
            }
            className="admin-input mt-1.5 w-full px-3 py-2"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="rating_high">Highest rated</option>
            <option value="rating_low">Lowest rated</option>
          </select>
        </label>
        </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() =>
            onChange({
              tab: state.tab,
              productSearch: "",
              datePreset: "all",
              sort: "newest",
              ratingBand: "all",
            })
          }
          className="text-sm font-medium text-lagari-brass hover:underline"
        >
          Clear filters
        </button>
      )}
      </div>
    </div>
  );
}

export function useReviewToolbarState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const state = useMemo(
    () => parseState(searchParams),
    [searchParams],
  );

  const setState = useCallback(
    (next: ReviewToolbarState) => {
      const qs = stateToSearchParams(next).toString();
      if (qs === searchParams.toString()) return;
      router.replace(
        qs
          ? `/admin-panel-route/reviews?${qs}`
          : "/admin-panel-route/reviews",
      );
    },
    [router, searchParams],
  );

  const patchState = useCallback(
    (patch: Partial<ReviewToolbarState>) => {
      const next = { ...parseState(searchParams), ...patch };
      const qs = stateToSearchParams(next).toString();
      if (qs === searchParams.toString()) return;
      router.replace(
        qs
          ? `/admin-panel-route/reviews?${qs}`
          : "/admin-panel-route/reviews",
      );
    },
    [router, searchParams],
  );

  return { state, setState, patchState };
}

export function formatReviewDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Karachi",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
