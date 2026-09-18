'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateContactMessage } from '../../../services/api';
import { contactMessageKeys } from '../../../utils/query-keys';
import type { UpdateContactMessageInput } from '../../../types';

export function useUpdateContactMessage(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateContactMessageInput) => updateContactMessage(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(contactMessageKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: contactMessageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactMessageKeys.stats() });
    },
  });
}
