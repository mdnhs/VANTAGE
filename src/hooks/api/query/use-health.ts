'use client';
import { useQuery } from '@tanstack/react-query';
import { API_ROUTES } from '@/lib/routes/api-routes';

async function fetchHealth() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}${API_ROUTES.health}`,
  );
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export function useHealth() {
  return useQuery({ queryKey: ['health'], queryFn: fetchHealth, staleTime: 60 * 1000 });
}
