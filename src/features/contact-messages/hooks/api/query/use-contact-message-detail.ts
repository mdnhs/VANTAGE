'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchContactMessageDetail } from '../../../services/api';
import { contactMessageKeys } from '../../../utils/query-keys';

export function useContactMessageDetail(id: string) {
  return useQuery({
    queryKey: contactMessageKeys.detail(id),
    queryFn: () => fetchContactMessageDetail(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}
