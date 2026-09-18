'use client';

import { createContext, useMemo, type ReactNode } from 'react';
import { createPermissionChecker, type PermissionChecker } from './utils';
import type { PermissionValue } from './permissions';

export const PermissionsContext = createContext<PermissionChecker | null>(null);

interface PermissionsProviderProps {
  // Pass the `permissions` array straight from the already-fetched `/auth/me` response.
  // Never fetch permissions separately — one fetch feeds the whole tree via context.
  permissions: PermissionValue[];
  children: ReactNode;
}

export function PermissionsProvider({ permissions, children }: PermissionsProviderProps) {
  const checker = useMemo(() => createPermissionChecker(permissions), [permissions]);
  return <PermissionsContext.Provider value={checker}>{children}</PermissionsContext.Provider>;
}
