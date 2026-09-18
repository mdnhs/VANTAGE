import type { TestimonialListFilters } from '../types';

// Standard hierarchical query-key factory: invalidating `lists()` refreshes every list
// variant, invalidating `detail(id)` refreshes just that one row.
export const testimonialKeys = {
  all: ['testimonials'] as const,
  lists: () => [...testimonialKeys.all, 'list'] as const,
  list: (filters: TestimonialListFilters) => [...testimonialKeys.lists(), filters] as const,
  details: () => [...testimonialKeys.all, 'detail'] as const,
  detail: (id: string) => [...testimonialKeys.details(), id] as const,
};
