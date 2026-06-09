"use client";

type Props = {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (next: number) => void;
  size?: "sm" | "md";
};

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  disabled,
  onChange,
  size = "md",
}: Props) {
  const btn =
    size === "sm"
      ? "h-8 w-8 text-sm"
      : "h-10 w-10 text-base";

  function step(delta: number) {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) onChange(next);
  }

  return (
    <div
      className={`inline-flex items-center rounded-sm border border-lagari-border bg-lagari-surface ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => step(-1)}
        className={`${btn} text-lagari-muted transition-colors hover:text-lagari-brass disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span
        className={`min-w-8 text-center font-medium text-lagari-primary ${
          size === "sm" ? "px-1 text-sm" : "px-2"
        }`}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => step(1)}
        className={`${btn} text-lagari-muted transition-colors hover:text-lagari-brass disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
