import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { hitToken } from '@/lib/seo/hit-token';

import { config, proxy } from './proxy';

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

describe('proxy: robots header', () => {
  it('marks dashboard and login responses noindex', async () => {
    const cookie = 'vantage.session_token=t';
    expect((await proxy(req('/dashboard/x', { cookie }))).headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect((await proxy(req('/dashboard'))).headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect((await proxy(req('/login'))).headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect((await proxy(req('/login', { cookie }))).headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });
});

describe('proxy: redirect enforcement', () => {
  const fetchMock = vi.fn();
  const answer = (body: unknown, status = 200) =>
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
  const redirect = (destination: unknown, statusCode: unknown = 301) => answer({ kind: 'redirect', destination, statusCode });

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('lets live and reserved paths through without calling the resolver', async () => {
    for (const path of ['/', '/services', '/api/v1/x', '/robots.txt', '/og/a', '/assets/x.jpg']) {
      const res = await proxy(req(path));
      expect(res.headers.get('location')).toBeNull();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('301s a resolved redirect and keeps the visitor query', async () => {
    redirect('/services');
    const res = await proxy(req('/old?utm=1&_rsc=abc'));
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('http://localhost:3000/services?utm=1');
    const url = fetchMock.mock.calls[0]![0] as URL;
    expect(url.pathname).toBe('/api/v1/resolve');
    expect(url.searchParams.get('path')).toBe('/old');
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ cache: 'no-store', redirect: 'manual' });
  });

  it('uses the destination query alone when it has one', async () => {
    redirect('/services?x=2');
    const res = await proxy(req('/old?utm=1'));
    expect(new URL(res.headers.get('location')!).search).toBe('?x=2');
  });

  it.each([302, 307, 308])('keeps status %i', async (status) => {
    redirect('/services', status);
    expect((await proxy(req('/old'))).status).toBe(status);
  });

  it.each([
    ['//evil.com', 301],
    ['https://evil.com', 301],
    ['/\tevil', 301],
    ['/services', 200],
    ['/services', 303],
  ])('ignores unsafe resolution %s / %i', async (destination, statusCode) => {
    redirect(destination, statusCode);
    const res = await proxy(req('/old'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('ignores an unknown kind', async () => {
    answer({ kind: 'weird' });
    expect((await proxy(req('/old'))).headers.get('location')).toBeNull();
  });

  it('fails open on reject, 500 and timeout', async () => {
    fetchMock.mockRejectedValue(new Error('down'));
    expect((await proxy(req('/old'))).headers.get('location')).toBeNull();
    answer({ kind: 'redirect', destination: '/services', statusCode: 301 }, 500);
    expect((await proxy(req('/old'))).headers.get('location')).toBeNull();

    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: URL, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal!.addEventListener('abort', () => reject(new Error('timeout')))),
    );
    const pending = proxy(req('/old'));
    await vi.advanceTimersByTimeAsync(301);
    expect((await pending).headers.get('location')).toBeNull();
  });

  it('asks the resolver for legacy page URLs but not for asset files', async () => {
    for (const p of ['/old.html', '/old.PHP', '/index.htm', '/page.aspx']) {
      fetchMock.mockClear();
      redirect('/services');
      expect((await proxy(req(p))).status).toBe(301);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
    fetchMock.mockClear();
    redirect('/services');
    await proxy(req('/logo.svg'));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips non-GET requests and draft previews without fetching', async () => {
    redirect('/services');
    const post = new NextRequest('http://localhost:3000/old', { method: 'POST' });
    expect((await proxy(post)).headers.get('location')).toBeNull();
    expect((await proxy(req('/old', { cookie: '__prerender_bypass=1' }))).headers.get('location')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('proxy: caching and hit signing', () => {
  const fetchMock = vi.fn();
  const sentHeaders = () => (fetchMock.mock.calls[0]![1] as RequestInit).headers as Record<string, string> | undefined;
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () =>
      new Response(JSON.stringify({ kind: 'redirect', destination: '/services', statusCode: 301 }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('lets browsers cache a 301 for an hour', async () => {
    expect((await proxy(req('/old'))).headers.get('cache-control')).toBe('public, max-age=3600');
  });

  it.each([
    [301, 'public, max-age=3600'],
    [308, 'public, max-age=3600'],
    [302, 'no-store'],
    [307, 'no-store'],
  ])('sets cache-control for a %i redirect', async (status, expected) => {
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ kind: 'redirect', destination: '/services', statusCode: status })),
    );
    expect((await proxy(req('/old'))).headers.get('cache-control')).toBe(expected);
  });

  it('sends no hit header when AUTH_SECRET is missing', async () => {
    vi.stubEnv('AUTH_SECRET', '');
    await proxy(req('/old'));
    expect(sentHeaders()?.['x-vantage-hit']).toBeUndefined();
    vi.unstubAllEnvs();
  });

  it('signs the resolver call for a plain GET', async () => {
    await proxy(req('/old'));
    expect(sentHeaders()?.['x-vantage-hit']).toBe(hitToken(process.env.AUTH_SECRET!, '/old'));
  });

  it.each([
    ['HEAD', {}],
    ['GET', { 'next-router-prefetch': '1' }],
    ['GET', { 'sec-purpose': 'prefetch' }],
    ['GET', { purpose: 'prefetch' }],
  ])('sends no hit header for %s %j', async (method, headers) => {
    await proxy(new NextRequest('http://localhost:3000/old', { method, headers }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sentHeaders()?.['x-vantage-hit']).toBeUndefined();
  });
});

describe('proxy matcher', () => {
  const matcher = new RegExp('^' + config.matcher[2] + '$');
  it('reaches custom page paths', () => {
    for (const p of ['/old-page', '/apiary', '/og-old', '/old.html', '/page.php']) expect(matcher.test(p)).toBe(true);
  });
  it('skips api, assets and metadata files', () => {
    for (const p of ['/api/v1/x', '/_next/static/a.js', '/robots.txt', '/sitemap.xml', '/favicon.ico', '/assets/x.jpg', '/og'])
      expect(matcher.test(p)).toBe(false);
  });
});
