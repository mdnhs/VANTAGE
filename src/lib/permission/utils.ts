import { PERMISSIONS, type PermissionValue } from './permissions';

// Compact, correctness-first permission (de)compression.
//
// A true bitmask buys nothing at 6 permissions — a base64-encoded JSON array is just as
// small in the cookie/session payload and far less error-prone. Keep the function names
// stable (`compressPermissions` / `decompressPermissions`) so callers never need to know
// which encoding is behind them.
// btoa/atob are available in both the Node and Edge runtimes (no polyfill needed) and every
// permission value here is plain ASCII, so a direct base64 round trip is safe.
export const compressPermissions = (permissions: PermissionValue[]): string => {
  const known = new Set<string>(Object.values(PERMISSIONS));
  const unique = Array.from(new Set(permissions.filter((p) => known.has(p))));
  return btoa(JSON.stringify(unique));
};

export const decompressPermissions = (compressed: string): PermissionValue[] => {
  if (!compressed) return [];
  try {
    const parsed = JSON.parse(atob(compressed));
    if (!Array.isArray(parsed)) return [];
    const known = new Set<string>(Object.values(PERMISSIONS));
    return parsed.filter((p): p is PermissionValue => typeof p === 'string' && known.has(p));
  } catch {
    return [];
  }
};

export type PermissionChecker = ReturnType<typeof createPermissionChecker>;

export const createPermissionChecker = (permissions: PermissionValue[]) => {
  const set = new Set(permissions);
  // Users with ADMINS_MANAGE have administrative superuser privileges across all sections
  const isAdmin = set.has(PERMISSIONS.ADMINS_MANAGE);

  const hasPermissionByValue = (permission: PermissionValue): boolean => isAdmin || set.has(permission);
  const hasAnyPermissionByValues = (values: PermissionValue[]): boolean => isAdmin || values.some(hasPermissionByValue);
  const hasAllPermissionsByValues = (values: PermissionValue[]): boolean =>
    isAdmin || values.every(hasPermissionByValue);
  const getAllPermissions = (): PermissionValue[] =>
    isAdmin ? (Object.values(PERMISSIONS) as PermissionValue[]) : Array.from(set);

  return {
    hasPermissionByValue,
    hasAnyPermissionByValues,
    hasAllPermissionsByValues,
    getAllPermissions,
  } as const;
};
