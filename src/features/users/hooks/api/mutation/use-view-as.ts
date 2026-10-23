'use client';

import { useMutation } from '@tanstack/react-query';

import { startViewAs } from '../../../services/api';

// The caller finishes with a full page load so no cached query outlives the identity switch.
export function useViewAs() {
  return useMutation({ mutationFn: startViewAs });
}
