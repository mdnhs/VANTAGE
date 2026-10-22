'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteMedia, fetchMediaPage, fetchMediaUsage, patchMedia, type MediaDetailsPatch } from '../services/api';
import type { MediaItem, MediaListParams } from '../types';

export const mediaKeys = {
  all: ['media'] as const,
  list: (params: MediaListParams) => [...mediaKeys.all, 'list', params] as const,
  byIds: (ids: string[]) => [...mediaKeys.all, 'ids', ids] as const,
  usage: (id: string) => [...mediaKeys.all, 'usage', id] as const,
};

// Load-more pages of 40; the flat item list is what screens render.
export function useMediaList(params: MediaListParams, enabled = true) {
  const query = useInfiniteQuery({
    queryKey: mediaKeys.list(params),
    queryFn: ({ pageParam }) => fetchMediaPage(params, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, _all, lastParam) => (last.hasNextPage ? lastParam + 1 : undefined),
    enabled,
  });
  return { ...query, items: query.data?.pages.flatMap((page) => page.items) ?? ([] as MediaItem[]) };
}

// The items a field already holds (<= 100), in no particular order.
export function useMediaByIds(ids: string[]) {
  const sorted = [...new Set(ids)].sort();
  return useQuery({
    queryKey: mediaKeys.byIds(sorted),
    queryFn: async () => (await fetchMediaPage({ ids: sorted }, 1, Math.min(sorted.length, 100))).items,
    enabled: sorted.length > 0,
  });
}

export const useMediaUsage = (id: string) =>
  useQuery({ queryKey: mediaKeys.usage(id), queryFn: () => fetchMediaUsage(id) });

export function useUpdateMedia(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch: MediaDetailsPatch) => patchMedia(id, patch),
    onSuccess: () => client.invalidateQueries({ queryKey: mediaKeys.all }),
  });
}

export function useDeleteMedia() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMedia(id),
    onSuccess: () => client.invalidateQueries({ queryKey: mediaKeys.all }),
  });
}
