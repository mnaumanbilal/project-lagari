"use client";

import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

function makeAdminQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  });
}

let adminQueryClient: QueryClient | undefined;

function getAdminQueryClient() {
  if (isServer) return makeAdminQueryClient();
  if (!adminQueryClient) adminQueryClient = makeAdminQueryClient();
  return adminQueryClient;
}

export function AdminQueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getAdminQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
