import type { PartnerLogoListFilters } from '../types';

// Standard hierarchical query-key factory: invalidating `lists()` refreshes every list
// variant, invalidating `detail(id)` refreshes just that one row.
export const partnerLogoKeys = {
  all: ['partner-logos'] as const,
  lists: () => [...partnerLogoKeys.all, 'list'] as const,
  list: (filters: PartnerLogoListFilters) => [...partnerLogoKeys.lists(), filters] as const,
  details: () => [...partnerLogoKeys.all, 'detail'] as const,
  detail: (id: string) => [...partnerLogoKeys.details(), id] as const,
};
