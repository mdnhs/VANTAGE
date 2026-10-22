'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchTracking } from '../../../services/api';
import { trackingKeys } from '../../../utils/query-keys';

// The form is keyed by version, so it always starts from what is stored.
export function useTracking() {
  return useQuery({
    queryKey: trackingKeys.detail(),
    queryFn: fetchTracking,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
