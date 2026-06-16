"use client";

import { useState } from "react";

type Props = {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  label?: string;
};

const SIZE_CLASS = {
  sm: "text-base gap-0.5",
  md: "text-xl gap-0.5",
  lg: "text-3xl gap-1",
} as const;

export function StarRating({
  value,
  onChange,
  max = 5,
  size = "md",
  readonly = false,
  label,
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = !readonly && Boolean(onChange);
  const display = hover ?? value;

  return (
    <span
      className={`inline-flex items-center ${SIZE_CLASS[size]}`}
      role={interactive ? "radiogroup" : "img"}
      aria-label={label ?? `${value} out of ${max} stars`}
      onMouseLeave={() => interactive && setHover(null)}
    >
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = star <= display;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHover(star)}
            onClick={() => onChange?.(star)}
            className={`leading-none transition-transform ${
              interactive
                ? "cursor-pointer hover:scale-110 disabled:cursor-default"
                : "cursor-default"
            } ${filled ? "text-lagari-brass" : "text-lagari-border"}`}
            role={interactive ? "radio" : undefined}
            aria-checked={interactive ? star === value : undefined}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
          >
            ★
          </button>
        );
      })}
    </span>
  );
}
