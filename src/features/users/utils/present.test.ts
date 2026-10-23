import { describe, expect, it } from 'vitest';

import type { MePayload } from '@/lib/auth/me';
import { permissionMap, type RoleName } from '@/lib/auth/permissions';

import type { UserDto } from '../types';
import { availableActions, userStatus } from './present';

const base: UserDto = {
  id: 'u',
  name: 'U',
  email: 'u@example.com',
  roles: ['editor'],
  twoFactorEnabled: false,
  banned: false,
  banReason: null,
  banExpires: null,
  invitePending: false,
  lastActiveAt: null,
  createdAt: '2026-01-01T00:00:00Z',
};
const now = new Date('2026-10-10T12:00:00Z');

const actorOf = (roles: RoleName[], impersonatedBy: string | null = null): MePayload => ({
  user: { id: 'me', email: 'me@example.com', name: 'Me' },
  roles,
  permissions: permissionMap(roles),
  twoFactorEnabled: false,
  impersonatedBy,
});

describe('userStatus', () => {
  it('names each state', () => {
    expect(userStatus(base, now)).toEqual({ label: 'Active', tone: 'success' });
    expect(userStatus({ ...base, invitePending: true }, now)).toEqual({ label: 'Invite pending', tone: 'info' });
    expect(userStatus({ ...base, banned: true }, now)).toEqual({ label: 'Banned', tone: 'danger' });
    expect(userStatus({ ...base, banned: true, banExpires: '2026-10-20T09:00:00Z' }, now).label).toBe(
      'Banned until 20 Oct 2026',
    );
  });

  it('treats an expired ban as active', () => {
    expect(userStatus({ ...base, banned: true, banExpires: '2026-10-01T00:00:00Z' }, now).label).toBe('Active');
  });
});

describe('availableActions', () => {
  it('offers nothing on yourself or while viewing as someone', () => {
    expect(availableActions(actorOf(['owner']), { ...base, id: 'me' }, now)).toEqual([]);
    expect(availableActions(actorOf(['owner'], 'x'), base, now)).toEqual([]);
  });

  it('hides owners from non-owners', () => {
    expect(availableActions(actorOf(['admin']), { ...base, roles: ['owner'] }, now)).toEqual([]);
  });

  it('gives an owner the full menu and swaps ban for unban', () => {
    expect(availableActions(actorOf(['owner']), base, now)).toEqual(['roles', 'view-as', 'ban', 'revoke', 'delete']);
    const banned = availableActions(actorOf(['owner']), { ...base, banned: true }, now);
    expect(banned).toContain('unban');
    expect(banned).not.toContain('ban');
    expect(banned).not.toContain('view-as');
  });

  it('offers resend only for a pending invite', () => {
    expect(availableActions(actorOf(['owner']), { ...base, invitePending: true }, now)).toContain('resend');
  });

  it('gives a viewer nothing', () => {
    expect(availableActions(actorOf(['viewer']), base, now)).toEqual([]);
  });
});
