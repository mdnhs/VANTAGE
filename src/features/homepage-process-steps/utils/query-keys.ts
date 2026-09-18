import type { HomepageProcessStepListFilters } from '../types';

// Standard hierarchical query-key factory: invalidating `lists()` refreshes every list
// variant, invalidating `detail(id)` refreshes just that one row.
export const homepageProcessStepKeys = {
  all: ['homepage-process-steps'] as const,
  lists: () => [...homepageProcessStepKeys.all, 'list'] as const,
  list: (filters: HomepageProcessStepListFilters) => [...homepageProcessStepKeys.lists(), filters] as const,
  details: () => [...homepageProcessStepKeys.all, 'detail'] as const,
  detail: (id: string) => [...homepageProcessStepKeys.details(), id] as const,
};
