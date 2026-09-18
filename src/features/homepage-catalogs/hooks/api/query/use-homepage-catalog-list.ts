'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminHomepageCatalogList } from '../../../services/api';
import { homepageCatalogKeys } from '../../../utils/query-keys';
import type { HomepageCatalogListFilters } from '../../../types';

export function useHomepageCatalogList(filters: HomepageCatalogListFilters) {
  return useQuery({
    queryKey: homepageCatalogKeys.list(filters),
    queryFn: () => fetchAdminHomepageCatalogList(filters),
    staleTime: 5 * 60 * 1000,
  });
}
