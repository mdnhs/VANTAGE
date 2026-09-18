'use client';

import { useMutation } from '@tanstack/react-query';
import { submitContactMessage } from '../../../services/api';
import type { CreateContactMessageInput } from '../../../types';

export function useSubmitContactMessage() {
  return useMutation({
    mutationFn: (input: CreateContactMessageInput) => submitContactMessage(input),
  });
}
