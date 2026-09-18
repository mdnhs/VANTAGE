import type { HomepageCatalogListFilters } from '../types';

export const homepageCatalogKeys = {
  all: ['homepage-catalogs'] as const,
  lists: () => [...homepageCatalogKeys.all, 'list'] as const,
  list: (filters: HomepageCatalogListFilters) => [...homepageCatalogKeys.lists(), filters] as const,
  details: () => [...homepageCatalogKeys.all, 'detail'] as const,
  detail: (id: string) => [...homepageCatalogKeys.details(), id] as const,
};
