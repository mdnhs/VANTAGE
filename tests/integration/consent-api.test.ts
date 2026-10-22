import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';
import { api } from '@/server/api';
import { db } from '@/server/db';
import { consentEvents } from '@/server/db/schema';
import { bannerHash } from '@/server/services/consent-service';

let n = 0;
const post = (body: unknown, ip: string, origin = 'http://localhost:3000') =>
  api.request('/api/v1/public/consent', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
const beacon = (over: Record<string, unknown> = {}) => ({
  id: randomUUID(),
  v: 1,
  a: true,
  m: false,
  action: 'custom',
  ...over,
});

describe('POST /public/consent', () => {
  beforeEach(async () => {
    await db.execute(sql`truncate table consent_events`);
    n += 1;
  });

  it('records a valid beacon with the server-computed banner hash, no session needed', async () => {
    const res = await post(beacon(), `10.7.0.${n}`);
    expect(res.status).toBe(204);
    const rows = await db.select().from(consentEvents);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ analytics: true, marketing: false, revision: 1, action: 'custom' });
    expect(rows[0]!.bannerHash).toBe(bannerHash(parseGlobal('consent', {})));
  });

  it('ignores a client-sent hash', async () => {
    await post({ ...beacon(), bannerHash: 'forged', banner_hash: 'forged' }, `10.7.0.${n}`);
    const [row] = await db.select().from(consentEvents);
    expect(row!.bannerHash).toBe(bannerHash(parseGlobal('consent', {})));
  });

  it('422s an invalid action and stores nothing', async () => {
    const res = await post(beacon({ action: 'maybe' }), `10.7.0.${n}`);
    expect(res.status).toBe(422);
    expect(await db.select().from(consentEvents)).toHaveLength(0);
  });

  it('422s a non-JSON body', async () => {
    const res = await api.request('/api/v1/public/consent', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000', 'x-forwarded-for': `10.7.0.${n}` },
      body: 'nope',
    });
    expect(res.status).toBe(422);
  });

  it('429s the 21st post from one address within the window', async () => {
    const ip = `10.8.0.${n}`;
    for (let i = 0; i < 20; i++) expect((await post(beacon(), ip)).status).toBe(204);
    expect((await post(beacon(), ip)).status).toBe(429);
    expect(await db.select().from(consentEvents)).toHaveLength(20);
  });

  it('accepts a same-origin text/plain beacon and blocks a foreign one at the CSRF check', async () => {
    const send = (origin: string) =>
      api.request('/api/v1/public/consent', {
        method: 'POST',
        headers: { origin, 'content-type': 'text/plain;charset=UTF-8', 'x-forwarded-for': `10.9.0.${n}` },
        body: JSON.stringify(beacon()),
      });
    expect((await send('http://localhost:3000')).status).toBe(204);
    expect((await send('https://evil.example')).status).toBe(403);
    expect(await db.select().from(consentEvents)).toHaveLength(1);
  });
});
