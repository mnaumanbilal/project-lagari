"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function RouteErrorFallback({ error, reset }: Props) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-display text-2xl font-semibold text-lagari-primary">
        Something went wrong
      </p>
      <p className="mt-3 text-sm text-lagari-muted">
        We hit an unexpected problem. You can try again — if it keeps happening,
        refresh the page or come back in a moment.
      </p>
      {process.env.NODE_ENV === "development" && error.message ? (
        <pre className="mt-4 max-h-32 w-full overflow-auto rounded-sm border border-lagari-border bg-lagari-elevated/40 p-3 text-left text-xs text-lagari-muted">
          {error.message}
        </pre>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-sm border border-lagari-brass px-5 py-2.5 text-sm font-medium text-lagari-brass hover:bg-lagari-brass/10"
      >
        Try again
      </button>
    </div>
  );
}
