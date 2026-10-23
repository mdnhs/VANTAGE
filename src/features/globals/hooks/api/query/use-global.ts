'use client';

import { useQuery } from '@tanstack/react-query';

import type { EditableGlobalKey } from '@/lib/content/global-access';

import { fetchGlobal } from '../../../services/api';
import { globalKeys } from '../../../utils/query-keys';

// The form is keyed by version, so it always starts from what is stored.
export function useGlobal(key: EditableGlobalKey) {
  return useQuery({
    queryKey: globalKeys.detail(key),
    queryFn: () => fetchGlobal(key),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
