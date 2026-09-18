// Standard hierarchical query-key factory: invalidating `lists()` refreshes the list,
// invalidating `detail(id)` refreshes just that one row.
export const adminUserKeys = {
  all: ['admin-users'] as const,
  lists: () => [...adminUserKeys.all, 'list'] as const,
  details: () => [...adminUserKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminUserKeys.details(), id] as const,
};
