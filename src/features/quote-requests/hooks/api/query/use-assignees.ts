'use client';
import { useQuery } from '@tanstack/react-query';
import { fetchAssignees } from '../../../services/api';

// Small staff list — one-shot fetch, no polling.
export function useAssignees() {
  return useQuery({
    queryKey: ['quote-requests', 'assignees'],
    queryFn: fetchAssignees,
    staleTime: 5 * 60 * 1000,
  });
}
