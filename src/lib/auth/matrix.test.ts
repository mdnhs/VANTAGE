import { describe, expect, it } from 'vitest';
import { permissionMatrix } from './matrix';
import { ROLE_NAMES, statement } from './permissions';
import { ROLE_LABELS, ROLE_PURPOSE } from './role-labels';
import { toMePayload } from './me';

const cell = (resource: string, action: string, role: string) =>
  permissionMatrix().find((r) => r.resource === resource && r.action === action)?.cells[
    role as keyof typeof ROLE_LABELS
  ];

describe('permissionMatrix', () => {
  it('has one row per resource action with a cell for every role', () => {
    const rows = permissionMatrix();
    const total = Object.values(statement).reduce((n, a) => n + a.length, 0);
    expect(rows).toHaveLength(total);
    for (const row of rows) {
      expect(Object.keys(row.cells)).toEqual([...ROLE_NAMES]);
    }
  });

  it('marks author content create/update and media update as own', () => {
    expect(cell('content', 'create', 'author')).toBe('own');
    expect(cell('content', 'update', 'author')).toBe('own');
    expect(cell('media', 'update', 'author')).toBe('own');
    expect(cell('content', 'read', 'author')).toBe('yes');
    expect(cell('content', 'delete', 'author')).toBe('no');
  });

  it('marks admin user/session actions as not-owners except impersonate-admins', () => {
    expect(cell('user', 'ban', 'admin')).toBe('not-owners');
    expect(cell('session', 'list', 'admin')).toBe('not-owners');
    expect(cell('user', 'impersonate-admins', 'admin')).toBe('no');
    expect(cell('user', 'impersonate-admins', 'owner')).toBe('yes');
  });

  it('reflects code and VANTAGE grants', () => {
    expect(cell('code', 'update', 'owner')).toBe('yes');
    expect(cell('code', 'update', 'admin')).toBe('no');
    expect(cell('page', 'update', 'editor')).toBe('yes');
    expect(cell('page', 'update', 'author')).toBe('no');
    expect(cell('quote', 'export', 'intake')).toBe('no');
    expect(cell('quote', 'update', 'intake')).toBe('yes');
    expect(cell('contact', 'read', 'marketer')).toBe('no');
  });
});

describe('role labels', () => {
  it('cover every role', () => {
    for (const name of ROLE_NAMES) {
      expect(ROLE_LABELS[name]).toBeTruthy();
      expect(ROLE_PURPOSE[name]).toBeTruthy();
    }
  });
});

describe('toMePayload', () => {
  it('builds the payload with merged permissions', () => {
    const me = toMePayload({
      userId: 'u1',
      email: 'a@b.co',
      name: 'A',
      roles: ['intake'],
      twoFactorEnabled: true,
      impersonatedBy: null,
    });
    expect(me.user).toEqual({ id: 'u1', email: 'a@b.co', name: 'A' });
    expect(me.roles).toEqual(['intake']);
    expect(me.permissions.quote).toEqual(['read', 'update']);
    expect(me.twoFactorEnabled).toBe(true);
    expect(me.impersonatedBy).toBeNull();
  });
});
