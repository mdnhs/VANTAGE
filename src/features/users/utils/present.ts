import { hasPermission, type Permissions } from '@/lib/auth/permissions';
import type { MePayload } from '@/lib/auth/me';

import type { UserAction, UserDto } from '../types';

export type StatusTone = 'success' | 'info' | 'danger';

const DAY = new Intl.DateTimeFormat('en-IE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/Dublin',
});

export function isBanned(user: UserDto, now = new Date()): boolean {
  const banEnd = user.banExpires ? new Date(user.banExpires) : null;
  return user.banned && (!banEnd || banEnd > now);
}

export function userStatus(user: UserDto, now = new Date()): { label: string; tone: StatusTone } {
  if (isBanned(user, now)) {
    const banEnd = user.banExpires ? new Date(user.banExpires) : null;
    return { label: banEnd ? `Banned until ${DAY.format(banEnd)}` : 'Banned', tone: 'danger' };
  }
  if (user.invitePending) return { label: 'Invite pending', tone: 'info' };
  return { label: 'Active', tone: 'success' };
}

// Mirrors server/services/user-admin/guard.ts so the menu only offers what the
// API will accept. A convenience: the API still decides.
export function availableActions(actor: MePayload, target: UserDto, now = new Date()): UserAction[] {
  if (actor.impersonatedBy || actor.user.id === target.id) return [];
  if (target.roles.includes('owner') && !actor.roles.includes('owner')) return [];
  const allowed = (permissions: Permissions) => hasPermission(actor.roles, permissions);
  const banned = isBanned(target, now);
  const needsAdminView = target.roles.some((role) => role === 'owner' || role === 'admin');
  const actions: UserAction[] = [];
  if (allowed({ user: ['set-role'] })) actions.push('roles');
  if (target.invitePending && allowed({ user: ['create'] })) actions.push('resend');
  if (allowed({ user: ['impersonate'] }) && !banned && (!needsAdminView || allowed({ user: ['impersonate-admins'] }))) {
    actions.push('view-as');
  }
  if (allowed({ user: ['ban'] })) actions.push(banned ? 'unban' : 'ban');
  if (allowed({ session: ['revoke'] })) actions.push('revoke');
  if (allowed({ user: ['delete'] })) actions.push('delete');
  return actions;
}
