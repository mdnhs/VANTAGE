import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppEnv } from '@/server/api/types';
import { onError } from '@/server/middleware/error';

const fresh = vi.fn();
vi.mock('@/server/lib/auth/fresh-session', () => ({ getFreshSession: (h: Headers) => fresh(h) }));

import { can, signedIn } from './auth';

const session = (role: string) => ({
  user: { id: 'u1', email: 'a@b.test', name: 'A', role },
  session: { id: 's1' },
});

function app(handler: (c: import('hono').Context<AppEnv>) => Response | Promise<Response>) {
  const a = new Hono<AppEnv>();
  a.onError(onError);
  a.get('/x', can({ page: ['read'] }), handler);
  a.get('/any', signedIn, (c) => c.json({ ok: true }));
  return a;
}

beforeEach(() => fresh.mockReset());

describe('guard Set-Cookie forwarding', () => {
  it('appends refreshed cookies after the handler ran', async () => {
    fresh.mockResolvedValue({ session: session('viewer'), setCookies: ['vantage.session_token=new; Path=/'] });
    const res = await app((c) => {
      c.header('Set-Cookie', 'other=1; Path=/', { append: true });
      return c.json({ ok: true });
    }).request('/x');
    expect(res.headers.getSetCookie()).toEqual(['other=1; Path=/', 'vantage.session_token=new; Path=/']);
  });

  it('skips a cookie name the handler already set (View-as replaces the session)', async () => {
    fresh.mockResolvedValue({ session: session('viewer'), setCookies: ['vantage.session_token=old; Path=/'] });
    const res = await app((c) => {
      c.header('Set-Cookie', 'vantage.session_token=viewas; Path=/', { append: true });
      return c.json({ ok: true });
    }).request('/x');
    expect(res.headers.getSetCookie()).toEqual(['vantage.session_token=viewas; Path=/']);
  });

  it('forwards cookies on a signedIn route too', async () => {
    fresh.mockResolvedValue({ session: session('viewer'), setCookies: ['vantage.session_token=new; Path=/'] });
    const res = await app(() => new Response('x')).request('/any');
    expect(res.headers.getSetCookie()).toEqual(['vantage.session_token=new; Path=/']);
  });

  it('still refuses anonymous (401) and customer (403) callers', async () => {
    fresh.mockResolvedValue({ session: null, setCookies: [] });
    expect((await app(() => new Response('x')).request('/x')).status).toBe(401);
    fresh.mockResolvedValue({ session: session('user'), setCookies: [] });
    expect((await app(() => new Response('x')).request('/x')).status).toBe(403);
  });
});
