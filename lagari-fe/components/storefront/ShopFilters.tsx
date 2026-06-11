"use client";

import Link from "next/link";
import type { CategoryOption, NoteTagOption } from "@/lib/types/catalog";
import { trackNoteFilterApply } from "@/lib/analytics/event-buffer";

function buildHref(category: string, note?: string, q?: string) {
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (note) params.set("note", note);
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

function sortCategories(categories: CategoryOption[]): CategoryOption[] {
  const all = categories.find((c) => c.slug === "all");
  const rest = categories.filter((c) => c.slug !== "all");
  return all ? [all, ...rest] : categories;
}

type ShopFiltersProps = {
  categories: CategoryOption[];
  noteTags: NoteTagOption[];
  activeCategory: string;
  activeNote?: string;
  activeQuery?: string;
};

export function ShopFilters({
  categories,
  noteTags,
  activeCategory,
  activeNote,
  activeQuery,
}: ShopFiltersProps) {
  const categoryChips = sortCategories(categories);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categoryChips.map((cat) => {
          const active = activeCategory === cat.slug;
          return (
            <Link
              key={cat.slug}
              href={buildHref(cat.slug, activeNote, activeQuery)}
              className={`shrink-0 rounded-full border px-4 py-2 font-label transition-colors ${
                active
                  ? "border-lagari-brass bg-lagari-brass text-lagari-deep"
                  : "border-lagari-border text-lagari-muted hover:border-lagari-brass hover:text-lagari-brass"
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref(activeCategory, undefined, activeQuery)}
          className={`rounded-sm border px-3 py-1.5 font-label text-xs transition-colors ${
            !activeNote
              ? "border-lagari-brass text-lagari-brass"
              : "border-lagari-border text-lagari-muted hover:text-lagari-brass"
          }`}
        >
          All notes
        </Link>
        {noteTags.map((n) => (
          <Link
            key={n.slug}
            href={buildHref(activeCategory, n.slug, activeQuery)}
            onClick={() => trackNoteFilterApply(n.slug)}
            className={`rounded-sm border px-3 py-1.5 font-label text-xs transition-colors ${
              activeNote === n.slug
                ? "border-lagari-brass text-lagari-brass"
                : "border-lagari-border text-lagari-muted hover:text-lagari-brass"
            }`}
          >
            {n.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
