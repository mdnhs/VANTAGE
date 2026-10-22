'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isConflict } from '@/features/globals/lib/submit-result';
import type { TrackingUpdate } from '@/validations/tracking-schema';

import { saveTracking } from '../../../services/api';
import { trackingKeys } from '../../../utils/query-keys';

// On success the saved document replaces the cached one; on a 409 the stored
// version is refetched so the form shows the other person's save.
export function useSaveTracking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: trackingKeys.save(),
    mutationFn: (input: TrackingUpdate) => saveTracking(input),
    onSuccess: (doc) => {
      queryClient.setQueryData(trackingKeys.detail(), doc);
    },
    onError: async (error) => {
      if (isConflict(error)) await queryClient.invalidateQueries({ queryKey: trackingKeys.detail() });
    },
  });
}
