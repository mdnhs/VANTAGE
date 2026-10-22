import { hasPermission, type RoleName } from '@/lib/auth/permissions';

// True when every role granting `content.update` is `author`: such a user writes
// only their own draft projects and nothing else in the content area.
export function isAuthorOnly(roles: readonly RoleName[]): boolean {
  return !roles.some((role) => role !== 'author' && hasPermission([role], { content: ['update'] }));
}

// Project fields an author-only user may never change.
export const AUTHOR_LOCKED_PROJECT_FIELDS = ['status', 'isFeatured', 'displayOrder'] as const;
