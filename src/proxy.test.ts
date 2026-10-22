import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { proxy } from './proxy';

const req = (url: string, init?: { cookie?: string; headers?: Record<string, string> }) =>
  new NextRequest(`http://localhost:3000${url}`, {
    headers: { ...(init?.cookie ? { cookie: init.cookie } : {}), ...init?.headers },
  });

describe('proxy', () => {
  it('redirects /dashboard without a session cookie to /login, remembering the page', async () => {
    const res = await proxy(req('/dashboard/quotes?x=1'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname + new URL(res.headers.get('location')!).search).toBe(
      '/login?next=%2Fdashboard%2Fquotes%3Fx%3D1',
    );
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('ignores the legacy cookie', async () => {
    const res = await proxy(req('/dashboard', { cookie: 'vantage_session=abc' }));
    expect(res.status).toBe(307);
  });

  it.each(['vantage.session_token=t', '__Secure-vantage.session_token=t'])('lets %s through', async (cookie) => {
    const res = await proxy(req('/dashboard/quotes', { cookie }));
    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-request-x-vantage-admin-path')).toBe('/dashboard/quotes');
  });

  it('overwrites a client-sent admin-path header', async () => {
    const res = await proxy(
      req('/dashboard/settings', { cookie: 'vantage.session_token=t', headers: { 'x-vantage-admin-path': '//evil' } }),
    );
    expect(res.headers.get('x-middleware-request-x-vantage-admin-path')).toBe('/dashboard/settings');
  });

  it('sends a signed-in visitor from /login to /dashboard', async () => {
    const res = await proxy(req('/login', { cookie: 'vantage.session_token=t' }));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/dashboard');
  });

  it('shows /login when the dashboard bounced the visitor back (no redirect loop)', async () => {
    const res = await proxy(req('/login?next=%2Fdashboard', { cookie: 'vantage.session_token=t' }));
    expect(res.status).toBe(200);
  });

  it('leaves /login alone when signed out', async () => {
    const res = await proxy(req('/login'));
    expect(res.status).toBe(200);
  });
});
