'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { SupportStatus } from '@/lib/support/types';

import { supportApi } from '../services/api';
import { SUPPORT_QUERY_KEYS as keys } from '../utils/query-keys';

// None of these poll: the live stream (SupportLive) invalidates them when something changes.
const FROM_STREAM = { staleTime: 60_000, refetchOnWindowFocus: false } as const;

export function useSupportUnread(enabled: boolean) {
  const { data } = useQuery({ queryKey: keys.unread(), queryFn: supportApi.unread, enabled, ...FROM_STREAM });
  return data?.count ?? 0;
}

export const useSupportList = (status: SupportStatus, limit: number) =>
  useQuery({ queryKey: keys.list(status, limit), queryFn: () => supportApi.list(status, limit), ...FROM_STREAM });

export const useSupportDetail = (id: string | null) =>
  useQuery({
    queryKey: keys.detail(id ?? ''),
    queryFn: () => supportApi.detail(id!),
    enabled: Boolean(id),
    ...FROM_STREAM,
  });

export const useSupportAgents = (enabled: boolean) =>
  useQuery({ queryKey: keys.agents(), queryFn: supportApi.agents, enabled, staleTime: 30_000 });

function useRefreshChat(id: string) {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: keys.detail(id) }),
      client.invalidateQueries({ queryKey: keys.lists() }),
      client.invalidateQueries({ queryKey: keys.unread() }),
    ]);
}

const showError = (error: Error) => toast.error(error.message);

export function useSendSupportMessage(id: string) {
  const refresh = useRefreshChat(id);
  return useMutation({
    mutationFn: (body: string) => supportApi.send(id, body),
    onSuccess: refresh,
    onError: showError,
  });
}

export function useAssignSupportChat(id: string) {
  const refresh = useRefreshChat(id);
  return useMutation({
    mutationFn: (userId: string | null) => supportApi.assign(id, userId),
    onSuccess: refresh,
    onError: showError,
  });
}

export function useCloseSupportChat(id: string) {
  const refresh = useRefreshChat(id);
  return useMutation({ mutationFn: () => supportApi.close(id), onSuccess: refresh, onError: showError });
}

export function useDeleteSupportChat(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => supportApi.remove(id),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: keys.lists() }),
        client.invalidateQueries({ queryKey: keys.unread() }),
      ]),
    onError: showError,
  });
}

// While viewing as someone the server answers 403; that is expected, the chat just stays unread.
export function useMarkSupportRead(id: string) {
  const refresh = useRefreshChat(id);
  return useMutation({ mutationFn: () => supportApi.markRead(id), onSuccess: refresh, onError: () => {} });
}
