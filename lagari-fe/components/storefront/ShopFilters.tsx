"use client";

import type { CategoryOption, NoteTagOption } from "@/lib/types/catalog";
import { trackNoteFilterApply } from "@/lib/analytics/event-buffer";

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
  onCategoryChange: (slug: string) => void;
  onNoteChange: (slug: string | undefined) => void;
};

export function ShopFilters({
  categories,
  noteTags,
  activeCategory,
  activeNote,
  onCategoryChange,
  onNoteChange,
}: ShopFiltersProps) {
  const categoryChips = sortCategories(categories);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categoryChips.map((cat) => {
          const active = activeCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onCategoryChange(cat.slug)}
              className={`shrink-0 rounded-full border px-4 py-2 font-label transition-colors ${
                active
                  ? "border-lagari-brass bg-lagari-brass text-lagari-deep"
                  : "border-lagari-border text-lagari-muted hover:border-lagari-brass hover:text-lagari-brass"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onNoteChange(undefined)}
          className={`rounded-sm border px-3 py-1.5 font-label text-xs transition-colors ${
            !activeNote
              ? "border-lagari-brass text-lagari-brass"
              : "border-lagari-border text-lagari-muted hover:text-lagari-brass"
          }`}
        >
          All notes
        </button>
        {noteTags.map((n) => (
          <button
            key={n.slug}
            type="button"
            onClick={() => {
              trackNoteFilterApply(n.slug);
              onNoteChange(n.slug);
            }}
            className={`rounded-sm border px-3 py-1.5 font-label text-xs transition-colors ${
              activeNote === n.slug
                ? "border-lagari-brass text-lagari-brass"
                : "border-lagari-border text-lagari-muted hover:text-lagari-brass"
            }`}
          >
            {n.name}
          </button>
        ))}
      </div>
    </div>
  );
}
