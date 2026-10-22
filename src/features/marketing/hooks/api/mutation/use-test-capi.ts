'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { GlobalApiError } from '@/features/globals/services/api';

import { testCapi } from '../../../services/api';

// Sends one neutral event with the saved Pixel, token and test code. The toast
// carries the server's message (Meta's error text is already scrubbed).
export function useTestCapi() {
  return useMutation({
    mutationFn: testCapi,
    onSuccess: (result) => (result.ok ? toast.success(result.message) : toast.error(result.message)),
    onError: (error) => {
      const first = error instanceof GlobalApiError ? Object.values(error.causes ?? {})[0]?.[0] : undefined;
      toast.error(first ?? error.message);
    },
  });
}
