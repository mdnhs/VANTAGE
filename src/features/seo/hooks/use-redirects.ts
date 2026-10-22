'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { RedirectInput, RedirectPatch } from '@/lib/seo/redirect-rules';

import {
  createRedirect,
  deleteRedirect,
  fetchRedirects,
  patchRedirect,
  type RedirectListParams,
} from '../services/redirects-api';

export const redirectKeys = {
  all: ['redirects'] as const,
  list: (params: { q?: string; page: number }) => [...redirectKeys.all, 'list', params] as const,
};

export const REDIRECTS_PAGE_SIZE = 25;

export function useRedirects({ q, page }: { q?: string; page: number }) {
  const params: RedirectListParams = { q: q || undefined, page, limit: REDIRECTS_PAGE_SIZE };
  return useQuery({
    queryKey: redirectKeys.list({ q: params.q, page }),
    queryFn: () => fetchRedirects(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateRedirect() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<RedirectInput, 'note'> & { note?: string }) => createRedirect(input),
    onSuccess: () => client.invalidateQueries({ queryKey: redirectKeys.all }),
  });
}

export function useUpdateRedirect() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: RedirectPatch }) => patchRedirect(id, patch),
    onSuccess: () => client.invalidateQueries({ queryKey: redirectKeys.all }),
  });
}

export function useDeleteRedirect() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRedirect(id),
    onSuccess: () => client.invalidateQueries({ queryKey: redirectKeys.all }),
  });
}
