import { randomUUID } from 'node:crypto';

import { eq, sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { encodeConsent } from '@/lib/tracking/consent';
import { api } from '@/server/api';
import { db } from '@/server/db';
import { auditLogs } from '@/server/db/schema';
import { CAPI_TOKEN_PURPOSE, encryptSecret } from '@/server/lib/secrets';
import { settingsRepository } from '@/server/repositories/settings-repository';
import { settleNotifications } from '@/server/services/enquiry-notify';
import { queueLeadConversion } from '@/server/services/lead-conversion';

import { sessionCookie } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

const TOKEN = 'x'.repeat(24) + 'SECRETTOKEN';
const nowSeconds = () => Math.floor(Date.now() / 1000);
const consentCookie = (over: Partial<{ v: number; ts: number; a: 0 | 1; m: 0 | 1 }> = {}) =>
  `vantage_consent=${encodeConsent({ id: 'visitor-1', v: 1, ts: nowSeconds(), a: 0, m: 1, ...over })}`;

const tracking = (enhanced = false) => ({
  gtmId: '',
  ga4Id: '',
  metaPixelId: '1234567890',
  capiTokenEncrypted: encryptSecret(TOKEN, CAPI_TOKEN_PURPOSE),
  testEventCode: '',
  enabled: { gtm: false, ga4: false, meta: true, capi: true },
  enhancedMatching: enhanced
    ? { enabled: true, acknowledgedAt: new Date().toISOString(), acknowledgedBy: 'owner@example.com' }
    : { enabled: false, acknowledgedAt: null, acknowledgedBy: null },
});

const save = (key: string, value: unknown) => settingsRepository.save(key, { version: 0, value }, null);

const quote = { name: 'Pat Murphy', email: 'pat@example.com', phone: '0871234567' };
const contact = { firstName: 'Pat', lastName: 'Q', email: 'pat@example.com', phone: '0871234567', message: 'hi' };

const post = (path: string, body: unknown, cookie?: string) =>
  api.request(`/api/v1${path}`, {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3000',
      'content-type': 'application/json',
      'user-agent': 'test-agent',
      'x-forwarded-for': '203.0.113.9, 10.0.0.1',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });

let fetchMock: ReturnType<typeof vi.fn>;
const sentBody = () => JSON.parse(fetchMock.mock.calls[0]![1].body as string) as { data: Record<string, unknown>[] };

beforeEach(async () => {
  await db.execute(
    sql`truncate table settings, revisions, audit_logs, enquiry_photos, quote_requests, contact_messages`,
  );
  await save('tracking', tracking());
  await save('consent', { enabled: true });
  fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('quote request lead conversion', () => {
  it('sends one deduplicated Lead for a visitor who allowed marketing', async () => {
    const eventId = randomUUID();
    const res = await post('/quotes', { ...quote, eventId, sourcePath: '/get-a-quote' }, consentCookie());
    expect(res.status).toBe(201);
    await settleNotifications();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [event] = sentBody().data;
    expect(event).toMatchObject({ event_name: 'Lead', event_id: eventId });
    expect(String(event!.event_source_url)).toMatch(/\/get-a-quote$/);
    const userData = event!.user_data as Record<string, unknown>;
    expect(userData.client_ip_address).toBe('203.0.113.9');
    expect(userData.client_user_agent).toBe('test-agent');
    expect(userData.em).toBeUndefined();
    expect(JSON.stringify(sentBody())).not.toContain('pat@example.com');
  });

  it('adds hashed email only when enhanced matching is on', async () => {
    await db.execute(sql`truncate table settings`);
    await save('consent', { enabled: true });
    await save('tracking', tracking(true));
    await post('/quotes', { ...quote, eventId: randomUUID(), sourcePath: '/get-a-quote' }, consentCookie());
    await settleNotifications();
    expect((sentBody().data[0]!.user_data as Record<string, unknown>).em).toBeDefined();
  });

  it.each([
    ['no cookie', undefined],
    ['an old consent version', consentCookie({ v: 2 })],
    ['marketing refused', consentCookie({ m: 0 })],
    ['a stale cookie', consentCookie({ ts: nowSeconds() - 200 * 86_400 })],
    ['a malformed cookie', 'vantage_consent=%7Bnot-json'],
    ['a cookie from the future', consentCookie({ ts: nowSeconds() + 3_600 })],
  ])('sends nothing with %s, and the lead still saves', async (_label, cookie) => {
    const res = await post('/quotes', { ...quote, eventId: randomUUID(), sourcePath: '/get-a-quote' }, cookie);
    expect(res.status).toBe(201);
    await settleNotifications();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends nothing without eventId or sourcePath', async () => {
    expect((await post('/quotes', quote, consentCookie())).status).toBe(201);
    expect((await post('/quotes', { ...quote, eventId: randomUUID() }, consentCookie())).status).toBe(201);
    await settleNotifications();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an eventId that is not a UUID', async () => {
    const res = await post('/quotes', { ...quote, eventId: 'abc', sourcePath: '/get-a-quote' }, consentCookie());
    expect(res.status).toBe(422);
  });

  it('sends nothing when the consent banner is off', async () => {
    await db.execute(sql`delete from settings where key = 'consent'`);
    await save('consent', { enabled: false });
    await post('/quotes', { ...quote, eventId: randomUUID(), sourcePath: '/get-a-quote' }, consentCookie());
    await settleNotifications();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('records only the status when Meta answers with an error, and still returns 201', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { message: TOKEN } }), { status: 400 }));
    const res = await post('/quotes', { ...quote, eventId: randomUUID(), sourcePath: '/get-a-quote' }, consentCookie());
    expect(res.status).toBe(201);
    await settleNotifications();
    const rows = await db.select().from(auditLogs).where(eq(auditLogs.action, 'tracking.capi_failed'));
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain(TOKEN);
  });

  it('returns 201 and records one failure when the network rejects', async () => {
    fetchMock.mockRejectedValue(new Error(`network down ${TOKEN}`));
    const res = await post('/quotes', { ...quote, eventId: randomUUID(), sourcePath: '/get-a-quote' }, consentCookie());
    expect(res.status).toBe(201);
    await settleNotifications();
    const rows = await db.select().from(auditLogs).where(eq(auditLogs.action, 'tracking.capi_failed'));
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain(TOKEN);
  }, 20_000);

  it('does not wait for Meta before answering', async () => {
    fetchMock.mockImplementation(() => new Promise(() => undefined));
    const res = await post('/quotes', { ...quote, eventId: randomUUID(), sourcePath: '/get-a-quote' }, consentCookie());
    expect(res.status).toBe(201);
  });

  it('never sends for staff-entered quotes', async () => {
    const intake = await sessionCookie('intake');
    const res = await post(
      '/quotes/admin',
      { ...quote, eventId: randomUUID(), sourcePath: '/get-a-quote' },
      `${intake}; ${consentCookie()}`,
    );
    expect(res.status).toBe(201);
    await settleNotifications();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('contact message lead conversion', () => {
  it('sends a Lead with the posted eventId and stores no tracking fields', async () => {
    const eventId = randomUUID();
    const res = await post('/contacts', { ...contact, eventId, sourcePath: '/contact' }, consentCookie());
    expect(res.status).toBe(201);
    await settleNotifications();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [event] = sentBody().data;
    expect(event).toMatchObject({ event_name: 'Lead', event_id: eventId });
    expect(String(event!.event_source_url)).toMatch(/\/contact$/);
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data).not.toHaveProperty('eventId');
    expect(body.data).not.toHaveProperty('sourcePath');
  });

  it('sends nothing without a cookie', async () => {
    expect((await post('/contacts', { ...contact, eventId: randomUUID(), sourcePath: '/contact' })).status).toBe(201);
    await settleNotifications();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('queueLeadConversion', () => {
  const lead = {
    leadId: 'lead-1',
    eventId: randomUUID(),
    sourcePath: '/contact',
    email: 'a@b.ie',
    phone: null,
    ip: null,
    userAgent: 'ua',
  };

  it('only an m:1 cookie sends', async () => {
    expect(await queueLeadConversion({ ...lead, cookieHeader: consentCookie({ m: 0, a: 1 }) })).toBe('skipped');
    expect(await queueLeadConversion({ ...lead, cookieHeader: undefined })).toBe('skipped');
    expect(await queueLeadConversion({ ...lead, cookieHeader: consentCookie() })).toBe('sent');
  });

  it('passes _fbp and _fbc through', async () => {
    await queueLeadConversion({
      ...lead,
      cookieHeader: `${consentCookie()}; _fbp=fb.1.1700000000000.123456789; _fbc=fb.1.1700000000000.AbCdEf`,
    });
    const userData = sentBody().data[0]!.user_data as Record<string, unknown>;
    expect(userData).toMatchObject({ fbp: 'fb.1.1700000000000.123456789', fbc: 'fb.1.1700000000000.AbCdEf' });
  });

  it('never throws when the settings read fails', async () => {
    const spy = vi.spyOn(settingsRepository, 'get').mockRejectedValue(new Error('db down'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      expect(await queueLeadConversion({ ...lead, cookieHeader: consentCookie() })).toBe('failed');
      expect(JSON.stringify(warn.mock.calls)).not.toContain('a@b.ie');
    } finally {
      spy.mockRestore();
      warn.mockRestore();
    }
  });
});
