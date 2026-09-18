'use client';

import type { ReactNode } from 'react';
import { usePermissions } from './usePermissions';
import type { PermissionValue } from './permissions';

interface ClientPermissionGateProps {
  permissions: PermissionValue[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

// Client-side guard, fed by permissions already fetched once via `/auth/me`
// (see PermissionsProvider) — never fetches or decodes anything per render.
export function ClientPermissionGate({
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: ClientPermissionGateProps) {
  const { hasAnyPermission, hasAllPermissions } = usePermissions();

  if (permissions.length === 0) return <>{children}</>;

  const hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
