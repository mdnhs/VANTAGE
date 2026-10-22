import type { AuditListParams } from '../types';

export const auditKeys = {
  all: ['audit'] as const,
  list: (params: AuditListParams) => [...auditKeys.all, 'list', params] as const,
  facets: () => [...auditKeys.all, 'facets'] as const,
  detail: (id: string) => [...auditKeys.all, 'detail', id] as const,
};
