'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchContactMessageStats } from '../../../services/api';
import { contactMessageKeys } from '../../../utils/query-keys';

export function useContactMessageStats() {
  return useQuery({
    queryKey: contactMessageKeys.stats(),
    queryFn: () => fetchContactMessageStats(),
    staleTime: 30 * 1000,
  });
}
