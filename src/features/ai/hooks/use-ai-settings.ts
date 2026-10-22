'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { aiApi, AiApiError } from '../services/api';
import type { AiAdmin, AiSettingsUpdate, ListModelsInput } from '../types';
import { AI_KEYS } from '../utils/query-keys';

// Always refetched on mount: the form is keyed by version, so it starts from what is stored.
export function useAiSettings() {
  return useQuery({
    queryKey: AI_KEYS.settings,
    queryFn: () => aiApi.getSettings(),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

// The response is the new AiAdmin (key masked); the typed key is never cached.
export function useSaveAiSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AiSettingsUpdate) => aiApi.saveSettings(input),
    onSuccess: async (saved: AiAdmin) => {
      queryClient.setQueryData(AI_KEYS.settings, saved);
      // The topbar status and the history list depend on these settings.
      await queryClient.invalidateQueries({ queryKey: AI_KEYS.status });
      await queryClient.invalidateQueries({ queryKey: AI_KEYS.conversations });
    },
    // A conflict loads the other person's version (the form is keyed by version).
    onError: async (error) => {
      if (error instanceof AiApiError && error.status === 409) {
        await queryClient.invalidateQueries({ queryKey: AI_KEYS.settings });
      }
    },
  });
}

export const useListModels = () => useMutation({ mutationFn: (input: ListModelsInput) => aiApi.listModels(input) });

export const useTestConnection = () => useMutation({ mutationFn: () => aiApi.testConnection() });
