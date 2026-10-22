'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchAuditFacets } from '../../../services/api';
import { auditKeys } from '../../../utils/query-keys';

export function useAuditFacets() {
  return useQuery({ queryKey: auditKeys.facets(), queryFn: fetchAuditFacets, staleTime: 5 * 60_000 });
}
