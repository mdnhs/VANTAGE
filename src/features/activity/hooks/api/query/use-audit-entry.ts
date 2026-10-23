'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchAuditEntry } from '../../../services/api';
import { auditKeys } from '../../../utils/query-keys';

// Audit rows never change, so a fetched entry is never stale.
export function useAuditEntry(id: string | null) {
  return useQuery({
    queryKey: auditKeys.detail(id ?? ''),
    queryFn: () => fetchAuditEntry(id!),
    enabled: id !== null,
    staleTime: Infinity,
  });
}
