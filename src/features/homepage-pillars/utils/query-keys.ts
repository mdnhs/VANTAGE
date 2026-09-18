import type { HomepagePillarListFilters } from '../types';

// Standard hierarchical query-key factory: invalidating `lists()` refreshes every list
// variant, invalidating `detail(id)` refreshes just that one row.
export const homepagePillarKeys = {
  all: ['homepage-pillars'] as const,
  lists: () => [...homepagePillarKeys.all, 'list'] as const,
  list: (filters: HomepagePillarListFilters) => [...homepagePillarKeys.lists(), filters] as const,
  details: () => [...homepagePillarKeys.all, 'detail'] as const,
  detail: (id: string) => [...homepagePillarKeys.details(), id] as const,
};
