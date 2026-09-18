'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchHomepageCatalogDetail } from '../../../services/api';
import { homepageCatalogKeys } from '../../../utils/query-keys';

export function useHomepageCatalogDetail(id: string) {
  return useQuery({
    queryKey: homepageCatalogKeys.detail(id),
    queryFn: () => fetchHomepageCatalogDetail(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  });
}
