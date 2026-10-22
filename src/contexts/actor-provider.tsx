'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useMe } from '@/features/auth/hooks/use-me';
import { hasPermission, type Permissions } from '@/lib/auth/permissions';
import type { MePayload } from '@/lib/auth/me';

const ActorContext = createContext<MePayload | null>(null);

// Seeded by the dashboard layout with the server-built payload; kept fresh by `useMe`.
// UI gating only — the API and the page guards authorise independently.
export function ActorProvider({ actor, children }: { actor: MePayload; children: ReactNode }) {
  const { data } = useMe(actor);
  return <ActorContext.Provider value={data ?? actor}>{children}</ActorContext.Provider>;
}

export function useActor(): MePayload {
  const actor = useContext(ActorContext);
  if (!actor) throw new Error('useActor must be used inside <ActorProvider>');
  return actor;
}

export function useCan(permissions: Permissions): boolean {
  return hasPermission(useActor().roles, permissions);
}
