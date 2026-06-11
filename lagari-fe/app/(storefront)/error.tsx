"use client";

export default function StorefrontError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-2xl text-lagari-primary">Something went wrong</h1>
      <p className="mt-3 text-sm text-lagari-muted">
        We could not load this page. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="lagari-btn-primary mt-8 px-6 py-3 text-sm"
      >
        Try again
      </button>
    </div>
  );
}
