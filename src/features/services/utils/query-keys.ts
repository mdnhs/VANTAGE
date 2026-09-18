import type { ServiceListFilters } from '../types';

// Standard hierarchical query-key factory: invalidating `lists()` refreshes every list
// variant, invalidating `detail(id)` refreshes just that one row.
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (filters: ServiceListFilters) => [...serviceKeys.lists(), filters] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
};
