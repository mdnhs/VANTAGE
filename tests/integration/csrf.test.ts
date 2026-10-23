import { describe, expect, it } from 'vitest';

import { api } from '@/server/api';

import { ORIGIN } from '../support/session';

const FORM = 'application/x-www-form-urlencoded';
const post = (path: string, headers: Record<string, string>, body = 'name=x') =>
  api.request(`/api/v1${path}`, { method: 'POST', headers: { 'content-type': FORM, ...headers }, body });

describe('CSRF origin check on writes', () => {
  it('rejects a cross-origin form POST with 403, public routes included', async () => {
    for (const path of ['/quotes', '/contacts', '/admin/users/x/ban']) {
      const res = await post(path, { origin: 'https://evil.example' });
      expect(res.status, path).toBe(403);
    }
  });

  it('rejects a write with no Origin at all', async () => {
    expect((await post('/quotes', {})).status).toBe(403);
  });

  it('lets the app origin through to the route (which then validates)', async () => {
    const res = await post('/quotes', { origin: ORIGIN });
    expect(res.status).not.toBe(403);
  });

  it('treats a same-site browser signal as cross-origin and a same-origin one as fine', async () => {
    expect((await post('/quotes', { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' })).status).toBe(
      403,
    );
    expect((await post('/quotes', { 'sec-fetch-site': 'same-origin' })).status).not.toBe(403);
  });

  it('never blocks reads', async () => {
    const res = await api.request('/api/v1/health', { headers: { origin: 'https://evil.example' } });
    expect(res.status).toBe(200);
  });
});
