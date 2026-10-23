'use client';

import { useQuery } from '@tanstack/react-query';
import type { MePayload } from '@/lib/auth/me';
import { API_ROUTES } from '@/lib/routes/api-routes';

export const ME_QUERY_KEY = ['auth', 'me'] as const;

async function fetchMe(): Promise<MePayload> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_PREFIX || '/api'}${process.env.NEXT_PUBLIC_API_VERSION || '/v1'}${API_ROUTES.auth.me}`,
    { credentials: 'include' },
  );
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load your account');
  return body.data as MePayload;
}

// `initialData` is the payload the panel layout already built on the server, so the shell
// never waits on this request; it only refreshes in the background.
export function useMe(initialData?: MePayload) {
  return useQuery({ queryKey: ME_QUERY_KEY, queryFn: fetchMe, initialData, staleTime: 60_000 });
}
