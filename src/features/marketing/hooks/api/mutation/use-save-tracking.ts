'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { TrackingUpdate } from '@/validations/tracking-schema';

import { saveTracking } from '../../../services/api';
import { trackingKeys } from '../../../utils/query-keys';

// On success the saved document replaces the cached one. A 409 is refetched by
// the form, which also shows the notice.
export function useSaveTracking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: trackingKeys.save(),
    // Variables can hold the typed token: never keep a finished mutation around.
    gcTime: 0,
    mutationFn: (input: TrackingUpdate) => saveTracking(input),
    onSuccess: (doc) => {
      queryClient.setQueryData(trackingKeys.detail(), doc);
    },
  });
}
