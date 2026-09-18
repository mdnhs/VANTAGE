'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteContactMessage } from '../../../services/api';
import { contactMessageKeys } from '../../../utils/query-keys';

export function useDeleteContactMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteContactMessage(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: contactMessageKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: contactMessageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactMessageKeys.stats() });
    },
  });
}
