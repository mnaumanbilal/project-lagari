"use client";

import { RouteErrorFallback } from "@/components/errors/RouteErrorFallback";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0c0b0a] text-[#e8e4dc] antialiased">
        <RouteErrorFallback error={error} reset={reset} />
      </body>
    </html>
  );
}
