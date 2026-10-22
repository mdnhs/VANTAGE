'use client';

import type { ReactNode } from 'react';
import { useActor } from '@/contexts/actor-provider';
import { isAuthorOnly } from '@/lib/auth/content-access';

// UI gating only — the API enforces the same rule.
export function useAuthorOnly(): boolean {
  return isAuthorOnly(useActor().roles);
}

// Hides controls an author-only user cannot use (create, reorder, enable).
export function HideForAuthorOnly({ children }: { children: ReactNode }) {
  return useAuthorOnly() ? null : <>{children}</>;
}
