'use client';

import { useQuery } from '@tanstack/react-query';

import { aiApi } from '../services/api';
import { AI_KEYS } from '../utils/query-keys';

export const useAiStatus = () =>
  useQuery({ queryKey: AI_KEYS.status, queryFn: () => aiApi.status(), staleTime: 60_000 });

// The saved-conversation list, fetched only while the history menu is open.
export const useAiConversations = (enabled: boolean) =>
  useQuery({ queryKey: AI_KEYS.conversations, queryFn: () => aiApi.conversations(), enabled });
