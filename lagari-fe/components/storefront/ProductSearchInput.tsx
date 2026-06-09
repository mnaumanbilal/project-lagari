"use client";

import { Loader2, Search, X } from "lucide-react";

type ProductSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  isSearching?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;
  onSubmit?: () => void;
};

export function ProductSearchInput({
  value,
  onChange,
  isSearching = false,
  placeholder = "Search impressions, designers…",
  id = "product-search",
  className = "",
  onSubmit,
}: ProductSearchInputProps) {
  return (
    <form
      className={`relative ${className}`.trim()}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lagari-muted"
        strokeWidth={1.75}
        aria-hidden
      />
      <input
        id={id}
        type="text"
        role="searchbox"
        enterKeyHint="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-sm border border-lagari-border bg-lagari-surface py-2.5 pl-10 pr-10 font-label text-sm text-lagari-primary placeholder:text-lagari-muted/70 transition-colors focus:border-lagari-brass focus:outline-none focus:ring-1 focus:ring-lagari-brass/30"
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {isSearching ? (
          <Loader2
            className="h-4 w-4 animate-spin text-lagari-brass"
            aria-hidden
          />
        ) : null}
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-sm p-0.5 text-lagari-muted transition-colors hover:text-lagari-brass"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
    </form>
  );
}
