'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // raise per-query for slow-moving data
      gcTime: 10 * 60 * 1000,
      retry: 1, // retries multiply cost against a failing backend
      refetchOnMount: false, // cached data is served; mutations invalidate explicitly
      refetchOnWindowFocus: false, // alt-tabbing must never wake Postgres
      refetchOnReconnect: false,
      refetchInterval: false, // NEVER enable without an explicit business reason
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
