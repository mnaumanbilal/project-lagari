import Link from "next/link";
import type { ReviewSummary } from "@/lib/types/catalog";

type Props = {
  summary: ReviewSummary | null | undefined;
  size?: "sm" | "md";
  href?: string;
  className?: string;
};

const SIZE_CLASS = {
  sm: "text-sm gap-0.5",
  md: "text-base gap-0.5",
} as const;

function ReadonlyStars({
  value,
  max = 5,
  size,
}: {
  value: number;
  max?: number;
  size: "sm" | "md";
}) {
  const rounded = Math.round(value);
  return (
    <span
      className={`inline-flex items-center ${SIZE_CLASS[size]}`}
      aria-hidden
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={
            i < rounded ? "text-lagari-brass" : "text-lagari-muted/35"
          }
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function ProductRatingSummary({
  summary,
  size = "md",
  href,
  className = "",
}: Props) {
  if (!summary || summary.totalCount <= 0) return null;

  const label = `${summary.averageRating.toFixed(1)} · ${summary.totalCount} review${
    summary.totalCount === 1 ? "" : "s"
  }`;

  const content = (
    <span
      className={`inline-flex flex-wrap items-center gap-2 ${className}`}
      aria-label={`Rated ${summary.averageRating.toFixed(1)} out of 5 from ${summary.totalCount} reviews`}
    >
      <ReadonlyStars value={summary.averageRating} size={size} />
      <span
        className={
          size === "sm"
            ? "text-xs text-lagari-muted"
            : "text-sm text-lagari-muted"
        }
      >
        <span className="font-medium text-lagari-primary">
          {summary.averageRating.toFixed(1)}
        </span>{" "}
        · {summary.totalCount} review{summary.totalCount === 1 ? "" : "s"}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="transition-opacity hover:opacity-90"
        aria-label={`${label} — view reviews`}
      >
        {content}
      </Link>
    );
  }

  return content;
}
