'use client';

import { useQuery } from '@tanstack/react-query';

import type { EditableGlobalKey } from '@/lib/content/global-access';

import { newestFirst } from '../../../lib/revisions';
import { fetchGlobalRevisions } from '../../../services/api';
import { globalKeys } from '../../../utils/query-keys';

export function useGlobalRevisions(key: EditableGlobalKey, enabled: boolean) {
  return useQuery({
    queryKey: globalKeys.revisions(key),
    queryFn: () => fetchGlobalRevisions(key),
    select: (data) => newestFirst(data.items),
    enabled,
  });
}
