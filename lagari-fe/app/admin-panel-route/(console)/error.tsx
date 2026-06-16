"use client";

import { RouteErrorFallback } from "@/components/errors/RouteErrorFallback";

export default function AdminConsoleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorFallback error={error} reset={reset} />;
}
