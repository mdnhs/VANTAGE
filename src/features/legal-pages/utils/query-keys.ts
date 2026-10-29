import type { LegalPageListFilters } from '../types';

// Standard hierarchical query-key factory: invalidating `lists()` refreshes every list
// variant, invalidating `detail(id)` refreshes just that one row.
export const legalPageKeys = {
  all: ['legal-pages'] as const,
  lists: () => [...legalPageKeys.all, 'list'] as const,
  list: (filters: LegalPageListFilters) => [...legalPageKeys.lists(), filters] as const,
  details: () => [...legalPageKeys.all, 'detail'] as const,
  detail: (id: string) => [...legalPageKeys.details(), id] as const,
};
