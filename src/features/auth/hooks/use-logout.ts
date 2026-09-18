'use client';

import { useMutation } from '@tanstack/react-query';
import { API_ROUTES } from '@/lib/routes/api-routes';

async function logout(): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}${API_ROUTES.auth.logout}`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body?.error?.message ?? 'Logout failed');
  }
}

export function useLogout() {
  return useMutation({ mutationFn: logout });
}
