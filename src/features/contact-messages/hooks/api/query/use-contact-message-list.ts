'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminContactMessageList } from '../../../services/api';
import { contactMessageKeys } from '../../../utils/query-keys';
import type { ContactMessageListQuery } from '../../../types';

export function useContactMessageList(query: ContactMessageListQuery) {
  return useQuery({
    queryKey: contactMessageKeys.list(query),
    queryFn: () => fetchAdminContactMessageList(query),
    staleTime: 30 * 1000,
  });
}
