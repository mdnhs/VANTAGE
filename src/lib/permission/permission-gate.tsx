import type { ReactNode } from 'react';
import { createPermissionChecker } from './utils';
import { getSession } from './server-utils';
import type { PermissionValue } from './permissions';

interface PermissionGateProps {
  permissions: PermissionValue[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

// Server component guard. UI-only convenience — the real enforcement is always the
// `requirePermission(...)` middleware on the Hono route.
export async function PermissionGate({
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const session = await getSession();
  if (!session) return <>{fallback}</>;

  if (permissions.length === 0) return <>{children}</>;

  const checker = createPermissionChecker(session.permissions);
  const hasAccess = requireAll
    ? checker.hasAllPermissionsByValues(permissions)
    : checker.hasAnyPermissionByValues(permissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
