'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchTheme } from '../../../services/api';
import { themeKeys } from '../../../utils/query-keys';

// The editor mounts on a copy fetched for this mount (see AppearanceView).
export function useTheme() {
  return useQuery({
    queryKey: themeKeys.detail(),
    queryFn: fetchTheme,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
