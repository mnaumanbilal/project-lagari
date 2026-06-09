"use client";

import { useEffect, useState } from "react";
import { listCategories, listNoteTags } from "@/lib/catalog";
import { getFieldError, hasFieldError, type FieldErrors } from "@/lib/admin/field-errors";
import type { CategoryOption, NoteTagOption } from "@/lib/types/catalog";

type TaxonomyKind = "categories" | "noteTags";

type Props = {
  kind: TaxonomyKind;
  label: string;
  fieldKey: string;
  selected: string[];
  onChange: (slugs: string[]) => void;
  errors?: FieldErrors;
  hint?: string;
};

const LOADERS: Record<
  TaxonomyKind,
  () => Promise<CategoryOption[] | NoteTagOption[]>
> = {
  categories: listCategories,
  noteTags: listNoteTags,
};

/** Shop filter slug — not assignable to products */
const PRODUCT_CATEGORY_EXCLUDE = new Set(["all"]);

export function AdminTaxonomyCheckboxes({
  kind,
  label,
  fieldKey,
  selected,
  onChange,
  errors,
  hint,
}: Props) {
  const [options, setOptions] = useState<CategoryOption[] | NoteTagOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const error = getFieldError(errors ?? {}, fieldKey);
  const invalid = hasFieldError(errors ?? {}, fieldKey);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    LOADERS[kind]()
      .then((rows) => {
        if (cancelled) return;
        const filtered =
          kind === "categories"
            ? rows.filter((r) => !PRODUCT_CATEGORY_EXCLUDE.has(r.slug))
            : rows;
        setOptions(filtered);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Could not load options. Refresh the page to try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kind]);

  function toggle(slug: string) {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  }

  return (
    <div
      data-admin-field={fieldKey}
      className={`block${invalid ? " admin-field-invalid" : ""}`}
    >
      <span className="text-sm font-medium text-lagari-muted">{label}</span>
      {hint && !error && (
        <p className="mt-1 text-xs text-lagari-muted">{hint}</p>
      )}

      <div className="admin-card mt-2 p-4">
        {loading && (
          <p className="text-sm text-lagari-muted">Loading options…</p>
        )}
        {loadError && (
          <p className="text-sm text-lagari-danger" role="alert">
            {loadError}
          </p>
        )}
        {!loading && !loadError && options.length === 0 && (
          <p className="text-sm text-lagari-muted">No options available.</p>
        )}
        {!loading && !loadError && options.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {options.map((opt) => (
              <label
                key={opt.slug}
                className="flex cursor-pointer items-center gap-2 rounded-sm border border-lagari-border bg-lagari-elevated px-3 py-2 transition-colors has-[:checked]:border-lagari-brass has-[:checked]:bg-lagari-brass/10"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.slug)}
                  onChange={() => toggle(opt.slug)}
                  className="accent-lagari-brass"
                />
                <span className="text-sm text-lagari-primary">{opt.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="admin-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
