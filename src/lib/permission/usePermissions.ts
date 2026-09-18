'use client';

import { useContext } from 'react';
import { PermissionsContext } from './permissions-provider';
import type { PermissionValue } from './permissions';

// Reads from the context populated once by `PermissionsProvider` (fed by `/auth/me`) —
// never fetches or decodes permissions per component.
export function usePermissions() {
  const checker = useContext(PermissionsContext);

  const hasPermission = (permission: PermissionValue): boolean => checker?.hasPermissionByValue(permission) ?? false;
  const hasAnyPermission = (permissions: PermissionValue[]): boolean =>
    checker?.hasAnyPermissionByValues(permissions) ?? false;
  const hasAllPermissions = (permissions: PermissionValue[]): boolean =>
    checker?.hasAllPermissionsByValues(permissions) ?? false;
  const getAllPermissions = (): PermissionValue[] => checker?.getAllPermissions() ?? [];

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getAllPermissions,
    isReady: checker !== null,
  };
}
