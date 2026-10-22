'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchThemeRevisions } from '../../../services/api';
import { themeKeys } from '../../../utils/query-keys';

export function useThemeRevisions() {
  return useQuery({
    queryKey: themeKeys.revisions(),
    queryFn: fetchThemeRevisions,
    select: (data) => data.items,
  });
}
