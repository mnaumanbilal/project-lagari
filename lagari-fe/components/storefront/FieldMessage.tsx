type Props = {
  id?: string;
  message?: string;
  variant?: "error" | "success" | "hint";
};

const VARIANT_CLASS: Record<NonNullable<Props["variant"]>, string> = {
  error: "text-lagari-danger",
  success: "text-lagari-brass",
  hint: "text-lagari-muted",
};

/** Inline helper/error text shown directly under a storefront input. */
export function FieldMessage({ id, message, variant = "error" }: Props) {
  if (!message) return null;

  return (
    <p id={id} role={variant === "error" ? "alert" : undefined} className={`mt-1.5 text-xs ${VARIANT_CLASS[variant]}`}>
      {message}
    </p>
  );
}

export function fieldInputClass(hasError: boolean, base = ""): string {
  const border = hasError
    ? "border-lagari-danger focus:border-lagari-danger"
    : "border-lagari-border focus:border-lagari-brass";
  return `w-full rounded-sm border bg-lagari-surface px-4 py-3 text-lagari-primary outline-none ${border} ${base}`.trim();
}
