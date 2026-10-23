import { hasPermission, type RoleName } from '@/lib/auth/permissions';

// A View-as session lasts at most an hour.
export const VIEW_AS_SECONDS = 60 * 60;

// Better Auth's adminRoles: viewing as someone holding one of these also
// needs user:impersonate-admins.
export const VIEW_AS_ADMIN_ROLES = ['owner', 'admin'] as const;

export type GuardActor = { userId: string; roles: readonly RoleName[] };
export type GuardTarget = { id: string; roles: readonly RoleName[] };

// May `actor` view as `target`? Checked when a View-as starts and again on
// every request of that session, so a later role change or promotion of the
// target ends it.
export function viewAsRefusal(actor: GuardActor, target: GuardTarget): string | null {
  if (actor.userId === target.id) return 'Manage your own account from the Account page';
  if (target.roles.includes('owner') && !actor.roles.includes('owner')) {
    return 'Only an owner can manage another owner';
  }
  if (!hasPermission(actor.roles, { user: ['impersonate'] })) return "You can't view as this person";
  if (
    target.roles.some((role) => (VIEW_AS_ADMIN_ROLES as readonly RoleName[]).includes(role)) &&
    !hasPermission(actor.roles, { user: ['impersonate-admins'] })
  ) {
    return "You can't view as this person";
  }
  return null;
}
