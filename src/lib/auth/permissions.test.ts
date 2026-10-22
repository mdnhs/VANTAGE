import { describe, expect, it } from 'vitest';
import { adminAc } from 'better-auth/plugins/admin/access';
import {
  ROLE_NAMES,
  hasPermission,
  isAdminRole,
  parseRoles,
  permissionMap,
  roles,
  statement,
  type Permissions,
  type RoleName,
} from './permissions';

const sorted = (p: Permissions) =>
  Object.fromEntries(
    Object.entries(p)
      .map(([r, a]) => [r, [...(a as string[])].sort()] as const)
      .sort(([a], [b]) => a.localeCompare(b)),
  );

// Exact grants for the non-owner/admin roles (MK grants + VANTAGE resources).
const EXPECTED: Record<Exclude<RoleName, 'owner' | 'admin'>, Permissions> = {
  editor: {
    dashboard: ['view'],
    page: ['read', 'update'],
    content: ['read', 'create', 'update', 'delete'],
    globals: ['read', 'update'],
    media: ['read', 'upload', 'update', 'delete'],
    seo: ['read', 'update'],
    redirect: ['read', 'manage'],
    ai: ['use'],
  },
  author: {
    dashboard: ['view'],
    page: ['read'],
    content: ['read', 'create', 'update'],
    media: ['read', 'upload', 'update'],
    ai: ['use'],
  },
  marketer: {
    dashboard: ['view'],
    page: ['read'],
    content: ['read'],
    globals: ['read'],
    media: ['read', 'upload', 'update'],
    seo: ['read', 'update'],
    redirect: ['read', 'manage'],
    tracking: ['read', 'update'],
    ai: ['use'],
  },
  intake: {
    dashboard: ['view'],
    quote: ['read', 'update'],
    contact: ['read', 'update'],
    ai: ['use'],
  },
  viewer: {
    dashboard: ['view'],
    page: ['read'],
    content: ['read'],
    globals: ['read'],
    seo: ['read'],
    ai: ['use'],
  },
};

describe('statement', () => {
  it('uses VANTAGE resources and drops MK-only ones', () => {
    for (const gone of ['article', 'collection', 'newsletter', 'lead']) {
      expect(statement).not.toHaveProperty(gone);
    }
    expect(statement.page).toEqual(['read', 'update']);
    expect(statement.content).toEqual(['read', 'create', 'update', 'delete']);
    expect(statement.quote).toEqual(['read', 'update', 'export', 'delete']);
    expect(statement.contact).toEqual(['read', 'update', 'export', 'delete']);
    expect(statement.user).toContain('impersonate-admins');
    expect(statement).toHaveProperty('session');
  });
});

describe('roles', () => {
  it('orders the 7 admin roles owner to viewer', () => {
    expect(ROLE_NAMES).toEqual(['owner', 'admin', 'editor', 'author', 'marketer', 'intake', 'viewer']);
  });

  it('owner has every action of every resource', () => {
    expect(sorted(permissionMap(['owner']))).toEqual(sorted(statement as unknown as Permissions));
    expect(hasPermission(['owner'], { code: ['update'] })).toBe(true);
    expect(hasPermission(['owner'], { user: ['impersonate-admins'] })).toBe(true);
  });

  it('admin has everything except code and impersonate-admins', () => {
    const map = permissionMap(['admin']);
    expect(map.code ?? []).toEqual([]);
    expect(hasPermission(['admin'], { code: ['update'] })).toBe(false);
    expect(hasPermission(['admin'], { user: ['impersonate-admins'] })).toBe(false);
    expect(sorted({ user: map.user, session: map.session })).toEqual(
      sorted({
        user: [...adminAc.statements.user],
        session: [...adminAc.statements.session],
      } as Permissions),
    );
    for (const [resource, actions] of Object.entries(statement)) {
      if (['code', 'user', 'session'].includes(resource)) continue;
      expect([...(map[resource as keyof Permissions] ?? [])].sort()).toEqual([...actions].sort());
    }
  });

  for (const [name, expected] of Object.entries(EXPECTED) as [keyof typeof EXPECTED, Permissions][]) {
    describe(name, () => {
      it('has exactly the expected grants', () => {
        expect(sorted(permissionMap([name]))).toEqual(sorted(expected));
      });

      it('allows/denies every resource x action accordingly', () => {
        for (const [resource, actions] of Object.entries(statement)) {
          for (const action of actions as readonly string[]) {
            const want = ((expected as Record<string, string[] | undefined>)[resource] ?? []).includes(action);
            expect(
              hasPermission([name], { [resource]: [action] } as Permissions),
              `${name} ${resource}.${action}`,
            ).toBe(want);
          }
        }
      });
    });
  }

  it('isolates marketer from quotes/contacts and intake from content', () => {
    expect(hasPermission(['marketer'], { quote: ['read'] })).toBe(false);
    expect(hasPermission(['marketer'], { contact: ['read'] })).toBe(false);
    expect(hasPermission(['intake'], { content: ['read'] })).toBe(false);
  });
});

describe('hasPermission', () => {
  it('is false with no roles', () => {
    expect(hasPermission([], { dashboard: ['view'] })).toBe(false);
  });

  it('unions multiple roles', () => {
    expect(hasPermission(['viewer', 'intake'], { quote: ['update'] })).toBe(true);
  });
});

describe('parseRoles', () => {
  it('trims and drops unknown names and the non-admin user role', () => {
    expect(parseRoles(' editor, user ,x')).toEqual(['editor']);
    expect(parseRoles('owner,admin')).toEqual(['owner', 'admin']);
  });

  it('handles null/undefined/empty', () => {
    expect(parseRoles(null)).toEqual([]);
    expect(parseRoles(undefined)).toEqual([]);
    expect(parseRoles('')).toEqual([]);
  });

  it('ignores prototype keys', () => {
    expect(parseRoles('toString,constructor')).toEqual([]);
  });
});

describe('isAdminRole', () => {
  it('is true only for a non-empty role list', () => {
    expect(isAdminRole([])).toBe(false);
    expect(isAdminRole(['viewer'])).toBe(true);
  });
});

it('roles object covers ROLE_NAMES', () => {
  expect(Object.keys(roles)).toEqual([...ROLE_NAMES]);
});
