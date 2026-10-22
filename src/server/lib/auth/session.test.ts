import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SessionLike } from './actor';

const requestHeaders = new Headers();
let current: SessionLike | null = null;

vi.mock('next/headers', () => ({ headers: async () => requestHeaders }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  // No request scope in a unit test: every call reads the current session.
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
vi.mock('./fresh-session', () => ({
  getFreshSession: async () => ({ session: current, setCookies: [] }),
}));

const { requireActor, requirePermission } = await import('./session');

const signedInAs = (role: string): SessionLike => ({
  user: { id: 'u1', email: `${role}@example.com`, name: role, role, twoFactorEnabled: false },
  session: { id: 's1' },
});

describe('requireActor', () => {
  beforeEach(() => {
    current = null;
    requestHeaders.delete('x-vantage-admin-path');
  });

  it('sends a signed-out visitor to /login, returning to the page they asked for', async () => {
    const { ADMIN_PATH_HEADER } = await import('@/lib/auth/admin-path');
    requestHeaders.set(ADMIN_PATH_HEADER, '/dashboard/pages?tab=draft');
    await expect(requireActor()).rejects.toThrow('REDIRECT /login?next=%2Fdashboard%2Fpages%3Ftab%3Ddraft');
  });

  it('redirects a role-user (customer) session to /login: valid session, no panel access', async () => {
    current = signedInAs('user');
    await expect(requireActor('/dashboard')).rejects.toThrow('REDIRECT /login?next=%2Fdashboard');
  });

  it('redirects a session with no recognised role', async () => {
    current = signedInAs('');
    await expect(requireActor('/dashboard')).rejects.toThrow(/^REDIRECT \/login/);
  });

  it.each(['owner', 'editor,admin', 'editor'])('lets %s through without two-factor', async (role) => {
    current = signedInAs(role);
    await expect(requireActor()).resolves.toMatchObject({ twoFactorEnabled: false });
  });
});

describe('requirePermission', () => {
  it('returns the actor when a role grants it', async () => {
    current = signedInAs('viewer');
    await expect(requirePermission({ page: ['read'] })).resolves.toMatchObject({ roles: ['viewer'] });
  });

  it('sends a role without it to /unauthorized', async () => {
    current = signedInAs('viewer');
    await expect(requirePermission({ quote: ['read'] })).rejects.toThrow('REDIRECT /unauthorized');
  });

  it('still sends a customer to /login first', async () => {
    current = signedInAs('user');
    await expect(requirePermission({ page: ['read'] })).rejects.toThrow(/^REDIRECT \/login/);
  });
});
