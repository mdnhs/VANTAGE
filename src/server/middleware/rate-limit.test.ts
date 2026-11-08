import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { rateLimit } from './rate-limit';

const hit = (app: Hono, headers: Record<string, string>) => app.request('/limited', { headers });

// Each test uses its own addresses: the buckets are shared by the whole module.
const limitedApp = () => new Hono().use(rateLimit(1, 60_000)).get('/limited', (c) => c.text('ok'));

describe('rateLimit behind Cloudflare', () => {
  it('cannot be dodged by changing x-forwarded-for', async () => {
    const app = limitedApp();
    await hit(app, { 'cf-connecting-ip': '198.51.100.1', 'x-forwarded-for': '1.1.1.1' });

    const second = await app.request('/limited', {
      headers: { 'cf-connecting-ip': '198.51.100.1', 'x-forwarded-for': '2.2.2.2' },
    });

    expect(second.status).not.toBe(200);
  });

  it('counts different Cloudflare visitors separately', async () => {
    const app = limitedApp();
    await hit(app, { 'cf-connecting-ip': '198.51.100.2' });

    expect((await hit(app, { 'cf-connecting-ip': '198.51.100.3' })).status).toBe(200);
  });

  it('falls back to x-forwarded-for without Cloudflare', async () => {
    const app = limitedApp();
    await hit(app, { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' });

    expect((await hit(app, { 'x-forwarded-for': '203.0.113.2, 10.0.0.1' })).status).toBe(200);
  });
});
