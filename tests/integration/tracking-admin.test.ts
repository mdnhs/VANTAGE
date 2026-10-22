import { eq, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { hasPermission, ROLE_NAMES, type RoleName } from '@/lib/auth/permissions';
import { parseTracking } from '@/lib/content/globals-marketing';
import { db } from '@/server/db';
import { auditLogs, revisions, settings } from '@/server/db/schema';
import { publicTrackingFrom } from '@/server/queries/get-public-tracking';
import { sendLeadToCapi } from '@/server/services/tracking-capi';

import { call, createTestUser, signInCookie, viewAsCookie } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

type Body = {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- one loose shape for several endpoints
  data: Record<string, any>;
  error: { code: string; message: string; causes?: Record<string, string[]> };
};
const json = async (res: Response) => (await res.json()) as Body;
const put = (cookie: string, body: unknown) => call('/admin/tracking', cookie, { method: 'PUT', body });
const TOKEN = 'x'.repeat(24) + 'SECRETTOKEN';
const value = {
  gtmId: 'GTM-TEST123',
  ga4Id: 'G-TEST123',
  metaPixelId: '1234567890',
  testEventCode: 'TEST123',
  enabled: { gtm: false, ga4: false, meta: false, capi: false },
};
const OTHER_KEY = Buffer.alloc(32, 8).toString('base64');

const cookies = {} as Record<RoleName, string>;
const allowed = (role: RoleName, mode: 'read' | 'update') => hasPermission([role], { tracking: [mode] });

beforeAll(async () => {
  for (const role of ROLE_NAMES) {
    const user = await createTestUser(role);
    cookies[role] = await signInCookie(user.email);
  }
});

beforeEach(async () => {
  await db.execute(sql`truncate table settings, revisions, audit_logs`);
  vi.mocked(revalidateTag).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('tracking permission matrix', () => {
  it('rejects anonymous callers', async () => {
    expect((await call('/admin/tracking')).status).toBe(401);
  });

  describe.each(ROLE_NAMES)('%s', (role) => {
    it('GET needs tracking.read, PUT needs tracking.update', async () => {
      expect((await call('/admin/tracking', cookies[role])).status).toBe(allowed(role, 'read') ? 200 : 403);
      expect((await put(cookies[role], { version: 0, value })).status).toBe(allowed(role, 'update') ? 200 : 403);
    });
  });

  it('only owner, admin and marketer can use it', () => {
    expect(ROLE_NAMES.filter((r) => allowed(r, 'update')).sort()).toEqual(['admin', 'marketer', 'owner']);
  });
});

describe('PUT /admin/tracking', () => {
  it('keeps the token write-only', async () => {
    const saved = await put(cookies.owner, { version: 0, value, capiToken: TOKEN });
    expect(saved.status).toBe(200);
    const body = await json(await call('/admin/tracking', cookies.owner));
    const text = JSON.stringify(body);
    expect(text).not.toContain(TOKEN);
    expect(text).not.toContain('SECRETTOKEN');
    expect(text).not.toContain('"v1.');
    expect(text).not.toContain('capiTokenEncrypted');
    expect(body.data.capiToken).toEqual({ configured: true, readable: true });
    expect(JSON.stringify(await json(saved))).not.toContain(TOKEN);
  });

  it('keeps the token when omitted and removes it with null', async () => {
    await put(cookies.owner, { version: 0, value, capiToken: TOKEN });
    const kept = await json(await put(cookies.owner, { version: 1, value }));
    expect(kept.data.capiToken.configured).toBe(true);
    const removed = await json(await put(cookies.owner, { version: 2, value, capiToken: null }));
    expect(removed.data.capiToken).toEqual({ configured: false, readable: null });
    expect(removed.data.version).toBe(3);
  });

  it('answers a stale version with 409', async () => {
    await put(cookies.owner, { version: 0, value });
    const res = await put(cookies.owner, { version: 0, value });
    expect(res.status).toBe(409);
    expect((await json(res)).error.code).toBe('CONFLICT');
  });

  it('refuses a token when the server has no key (422 on capiToken)', async () => {
    vi.stubEnv('APP_ENCRYPTION_KEY', '');
    const res = await put(cookies.owner, { version: 0, value, capiToken: TOKEN });
    expect(res.status).toBe(422);
    expect((await json(res)).error.causes?.capiToken?.[0]).toContain('no APP_ENCRYPTION_KEY');
    expect(await db.select().from(settings)).toHaveLength(0);
  });

  it('rejects a malformed id with a field error', async () => {
    const res = await put(cookies.owner, { version: 0, value: { ...value, gtmId: 'gtm-bad' } });
    expect(res.status).toBe(422);
    expect((await json(res)).error.causes).toHaveProperty('gtmId');
  });

  it('writes no revision and expires only the tracking tag', async () => {
    await put(cookies.owner, { version: 0, value, capiToken: TOKEN });
    expect(await db.select().from(revisions)).toHaveLength(0);
    expect(vi.mocked(revalidateTag).mock.calls).toEqual([['settings:tracking', { expire: 0 }]]);
  });

  it('audits a redacted diff: configured/replaced/removed, never the ciphertext', async () => {
    await put(cookies.owner, { version: 0, value, capiToken: TOKEN });
    await put(cookies.owner, { version: 1, value, capiToken: null });
    const rows = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, 'tracking.update'))
      .orderBy(auditLogs.createdAt);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.diff).toMatchObject({ capiToken: { from: 'none', to: 'replaced' } });
    expect(rows[1]!.diff).toMatchObject({ capiToken: { from: 'configured', to: 'removed' } });
    const all = JSON.stringify(rows);
    expect(all).not.toContain('capiTokenEncrypted');
    expect(all).not.toContain('"v1.');
    expect(all).not.toContain(TOKEN);
  });
});

describe('channel status', () => {
  const statusOf = async () => (await json(await call('/admin/tracking', cookies.owner))).data.status;

  it('needs the banner, then is ready', async () => {
    await put(cookies.owner, { version: 0, value: { ...value, enabled: { ...value.enabled, gtm: true } } });
    expect((await statusOf()).gtm).toBe('needs-banner');
    await db.insert(settings).values({ key: 'consent', value: { enabled: true }, version: 1 });
    expect((await statusOf()).gtm).toBe('ready');
  });

  it('capi without a pixel needs one', async () => {
    await put(cookies.owner, {
      version: 0,
      value: { ...value, metaPixelId: '', enabled: { ...value.enabled, capi: true } },
    });
    expect((await statusOf()).capi).toBe('needs-pixel');
  });

  it('capi with a token sealed by another key is unreadable', async () => {
    await put(cookies.owner, {
      version: 0,
      value: { ...value, enabled: { ...value.enabled, capi: true } },
      capiToken: TOKEN,
    });
    vi.stubEnv('APP_ENCRYPTION_KEY', OTHER_KEY);
    const body = await json(await call('/admin/tracking', cookies.owner));
    expect(body.data.status.capi).toBe('unreadable-token');
    expect(body.data.capiToken).toEqual({ configured: true, readable: false });
  });
});

describe('enhanced matching', () => {
  it('is owner only', async () => {
    const res = await put(cookies.marketer, {
      version: 0,
      value,
      enhancedMatching: { enabled: true, acknowledge: true },
    });
    expect(res.status).toBe(403);
    expect(await db.select().from(settings)).toHaveLength(0);
  });

  it('needs the acknowledgement, then records it with a second audit row', async () => {
    const without = await put(cookies.owner, { version: 0, value, enhancedMatching: { enabled: true } });
    expect(without.status).toBe(422);
    expect((await json(without)).error.causes).toHaveProperty(['enhancedMatching.acknowledge']);
    const withAck = await put(cookies.owner, {
      version: 0,
      value,
      enhancedMatching: { enabled: true, acknowledge: true },
    });
    expect(withAck.status).toBe(200);
    const em = (await json(withAck)).data.value.enhancedMatching;
    expect(em.enabled).toBe(true);
    expect(em.acknowledgedAt).toEqual(expect.any(String));
    const rows = await db.select().from(auditLogs).where(eq(auditLogs.action, 'tracking.enhanced_matching'));
    expect(rows).toHaveLength(1);
  });
});

describe('POST /admin/tracking/test-capi', () => {
  const post = (cookie: string) => call('/admin/tracking/test-capi', cookie, { method: 'POST' });

  it('is limited to roles that can update', async () => {
    expect((await post(cookies.editor)).status).toBe(403);
    expect((await post(cookies.viewer)).status).toBe(403);
  });

  it('asks for the missing fields first', async () => {
    await put(cookies.owner, { version: 0, value: { ...value, metaPixelId: '', testEventCode: '' } });
    const res = await post(cookies.owner);
    expect(res.status).toBe(422);
    expect((await json(res)).error.causes).toEqual({
      metaPixelId: ['Add the Pixel ID first'],
      capiToken: ['Add a readable access token first'],
      testEventCode: ['Add the test event code from Events Manager first'],
    });
  });

  it('sends one neutral PageView to Graph with the test code and audits it', async () => {
    await put(cookies.owner, { version: 0, value, capiToken: TOKEN });
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await post(cookies.owner);
    expect(res.status).toBe(200);
    expect((await json(res)).data).toMatchObject({ ok: true, status: 200 });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]! as unknown as [string, RequestInit];
    expect(url).toBe('https://graph.facebook.com/v26.0/1234567890/events');
    const sent = JSON.parse(String(init.body));
    expect(sent.test_event_code).toBe('TEST123');
    expect(sent.data[0].event_name).toBe('PageView');
    expect(sent.access_token).toBe(TOKEN);
    const audit = await db.select().from(auditLogs).where(eq(auditLogs.action, 'tracking.test_event'));
    expect(audit).toHaveLength(1);
    expect(JSON.stringify(audit)).not.toContain(TOKEN);
  });

  it('reports a Meta refusal without the token', async () => {
    await put(cookies.owner, { version: 0, value, capiToken: TOKEN });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: { message: `bad ${TOKEN}` } }), { status: 400 })),
    );
    const body = await json(await post(cookies.owner));
    expect(body.data.ok).toBe(false);
    expect(JSON.stringify(body)).not.toContain(TOKEN);
  });
});

describe('public tracking and lead sending', () => {
  it('exposes validated ids only, and GA4 only with GTM', () => {
    const t = parseTracking({
      ...value,
      capiTokenEncrypted: 'v1.a.b.c',
      enabled: { gtm: false, ga4: true, meta: true, capi: true },
    });
    const pub = publicTrackingFrom(t);
    expect(pub).toEqual({ gtmId: null, ga4Id: null, pixelId: '1234567890' });
    expect(JSON.stringify(pub)).not.toContain('v1.');
    expect(publicTrackingFrom({ ...t, enabled: { ...t.enabled, gtm: true } }).ga4Id).toBe('G-TEST123');
  });

  const lead = {
    leadId: 'lead-1',
    eventId: 'evt-1',
    eventTime: new Date(),
    sourcePath: '/contact',
    ip: null,
    userAgent: 'ua',
    email: 'a@b.ie',
    phone: null,
  };

  it('skips when CAPI is off, sends when on, and records only the status on failure', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    expect(await sendLeadToCapi(lead, { fetchImpl: fetchImpl as never })).toBe('skipped');
    await put(cookies.owner, {
      version: 0,
      value: { ...value, enabled: { ...value.enabled, capi: true } },
      capiToken: TOKEN,
    });
    expect(await sendLeadToCapi(lead, { fetchImpl: fetchImpl as never })).toBe('sent');
    expect(await sendLeadToCapi({ ...lead, sourcePath: '//evil' }, { fetchImpl: fetchImpl as never })).toBe('skipped');

    const failing = vi.fn(async () => new Response(JSON.stringify({ error: { message: TOKEN } }), { status: 400 }));
    expect(await sendLeadToCapi(lead, { fetchImpl: failing as never })).toBe('failed');
    const rows = await db.select().from(auditLogs).where(eq(auditLogs.action, 'tracking.capi_failed'));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ actorId: null, entityType: 'setting', entityId: 'tracking' });
    expect(rows[0]!.summary).toBe('Meta Conversions API did not accept a Lead event (HTTP 400)');
    expect(JSON.stringify(rows)).not.toContain(TOKEN);
    const admin = await json(await call('/admin/tracking', cookies.owner));
    expect(admin.data.lastCapiFailure.summary).toContain('HTTP 400');
  });
});

describe('View-as and rate limit', () => {
  it('refuses to save or send a test event while viewing as someone', async () => {
    const target = await createTestUser('marketer');
    const viewing = await viewAsCookie(cookies.owner, target.id);
    const saved = await put(viewing, { version: 0, value, capiToken: TOKEN });
    expect(saved.status).toBe(403);
    expect((await json(saved)).error.code).toBe('IMPERSONATION_READ_ONLY');
    const tested = await call('/admin/tracking/test-capi', viewing, { method: 'POST' });
    expect(tested.status).toBe(403);
    expect((await json(tested)).error.code).toBe('IMPERSONATION_READ_ONLY');
    expect(await db.select().from(settings)).toHaveLength(0);
    const rows = await db.select({ action: auditLogs.action }).from(auditLogs);
    expect(rows.filter((r) => r.action.startsWith('tracking.'))).toEqual([]);
  });

  it('limits test events to 5 a minute with a clear message', async () => {
    let last: Response | undefined;
    for (let i = 0; i < 8; i++) {
      last = await call('/admin/tracking/test-capi', cookies.owner, { method: 'POST' });
      if (last.status === 429) break;
    }
    expect(last!.status).toBe(429);
    expect((await json(last!)).error.message).toBe('Too many test events. Wait a minute and try again.');
  });
});
