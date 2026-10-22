'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchAuditList } from '../../../services/api';
import type { AuditListParams } from '../../../types';
import { auditKeys } from '../../../utils/query-keys';

export function useAuditList(params: AuditListParams) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => fetchAuditList(params),
    placeholderData: keepPreviousData,
  });
}
