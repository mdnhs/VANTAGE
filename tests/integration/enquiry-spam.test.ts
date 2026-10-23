import nodemailer from 'nodemailer';
import { desc, eq, sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/server/api';
import { db } from '@/server/db';
import { auditLogs, contactMessages, enquiryPhotos, quoteRequests } from '@/server/db/schema';
import { resetMailerForTests } from '@/server/lib/email/mailer';
import { issueStamp } from '@/server/lib/enquiries/stamp';
import { CAPI_TOKEN_PURPOSE, encryptSecret } from '@/server/lib/secrets';
import { settingsRepository } from '@/server/repositories/settings-repository';
import { settleNotifications } from '@/server/services/enquiry-notify';
import { runRetention } from '@/server/services/retention-service';
import { encodeConsent } from '@/lib/tracking/consent';

import { call, createTestUser, ORIGIN, sessionCookie, viewAsCookie } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

const quote = { name: 'Pat Murphy', email: 'pat@example.com', phone: '0871234567' };
const contact = { firstName: 'Pat', lastName: 'Q', email: 'pat@example.com', phone: '0871234567', message: 'hi' };
const stampAge = (ms: number) => issueStamp(Date.now() - ms);

// A tiny valid JPEG-free photo is not needed: spam skips photo storage, so a malformed-but-schema-valid
// data URL would only matter if storage ran. Use a real 1x1 PNG.
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const post = (path: string, body: unknown, cookie?: string) =>
  api.request(`/api/v1${path}`, {
    method: 'POST',
    headers: {
      origin: ORIGIN,
      'content-type': 'application/json',
      'user-agent': 'test-agent',
      'x-forwarded-for': '203.0.113.9',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });

const save = (key: string, value: unknown) => settingsRepository.save(key, { version: 0, value }, null);

let sent: string[];
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  await db.execute(
    sql`truncate table settings, revisions, audit_logs, enquiry_photos, quote_requests, contact_messages, media cascade`,
  );
  vi.stubEnv('SMTP_HOST', 'smtp.example.com');
  vi.stubEnv('MAIL_FROM', 'Shop <no-reply@example.com>');
  const t = nodemailer.createTransport({ jsonTransport: true });
  sent = [];
  vi.spyOn(t, 'sendMail').mockImplementation((async (m: Record<string, unknown>) => {
    sent.push(String(m.subject));
    return { messageId: 'id-1' };
  }) as never);
  resetMailerForTests(t);
  await save('notifications', { recipients: ['staff@example.com'] });
  await save('consent', { enabled: true });
  await save('tracking', {
    gtmId: '',
    ga4Id: '',
    metaPixelId: '1234567890',
    capiTokenEncrypted: encryptSecret('x'.repeat(24), CAPI_TOKEN_PURPOSE),
    testEventCode: '',
    enabled: { gtm: false, ga4: false, meta: true, capi: true },
    enhancedMatching: { enabled: false, acknowledgedAt: null, acknowledgedBy: null },
  });
  fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(async () => {
  await settleNotifications();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  resetMailerForTests();
});

const consent = `vantage_consent=${encodeConsent({ id: 'v1', v: 1, ts: Math.floor(Date.now() / 1000), a: 0, m: 1 })}`;
const quoteRows = () => db.select().from(quoteRequests);
const contactRows = () => db.select().from(contactMessages);

describe('public quote form spam checks', () => {
  it('files a filled honeypot as spam: 201, no mail, no CAPI, no photos', async () => {
    const res = await post(
      '/quotes',
      { ...quote, website: 'http://x', stamp: stampAge(10_000), photoUrls: [PNG], eventId: crypto.randomUUID() },
      consent,
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.photos).toBeUndefined();
    await settleNotifications();
    const [row] = await quoteRows();
    expect(row).toMatchObject({ status: 'spam', spamReason: 'honeypot' });
    expect(sent).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await db.select().from(enquiryPhotos)).toHaveLength(0);
  });

  it('files an invalid or too-fresh stamp as spam, but keeps an unstamped lead', async () => {
    expect((await post('/quotes', quote)).status).toBe(201);
    expect((await post('/quotes', { ...quote, stamp: '' })).status).toBe(201);
    expect((await post('/quotes', { ...quote, stamp: stampAge(1_000) })).status).toBe(201);
    expect((await post('/quotes', { ...quote, stamp: 'garbage' })).status).toBe(201);
    const reasons = (await quoteRows()).map((r) => `${r.status}:${r.spamReason}`).sort();
    expect(reasons).toEqual(['new:null', 'new:null', 'spam:stamp', 'spam:too-fast']);
  });

  it('answers a bot exactly like a human', async () => {
    for (const [route, body] of [
      ['/quotes', quote],
      ['/contacts', contact],
    ] as const) {
      const human = (await (await post(route, { ...body, stamp: stampAge(5_000) })).json()).data;
      const bot = (await (await post(route, { ...body, website: 'x' })).json()).data;
      expect(Object.keys(bot).sort()).toEqual(Object.keys(human).sort());
      expect(bot.status).toBe('new');
      expect(bot.spamReason).toBeNull();
    }
  });

  it('staff create cannot file spam', async () => {
    const owner = await sessionCookie('owner');
    const res = await call('/quotes/admin', owner, { method: 'POST', body: { ...quote, status: 'spam' } });
    expect(res.status).toBe(422);
  });

  it('keeps a valid 5 s stamp as a new lead that notifies and converts', async () => {
    const res = await post(
      '/quotes',
      { ...quote, website: '', stamp: stampAge(5_000), eventId: crypto.randomUUID(), sourcePath: '/get-a-quote' },
      consent,
    );
    expect(res.status).toBe(201);
    await settleNotifications();
    const [row] = await quoteRows();
    expect(row).toMatchObject({ status: 'new', spamReason: null });
    expect(sent.length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails open when the secret is unusable', async () => {
    vi.stubEnv('AUTH_SECRET', '');
    expect((await post('/quotes', quote)).status).toBe(201);
    expect((await quoteRows())[0]).toMatchObject({ status: 'new', spamReason: null });
  });
});

describe('public contact form spam checks', () => {
  it('files honeypot, missing and too-fast submissions as spam, and a valid one as new', async () => {
    await post('/contacts', { ...contact, website: 'x', stamp: stampAge(10_000), photoUrls: [PNG] }, consent);
    await post('/contacts', { ...contact, stamp: 'garbage' });
    await post('/contacts', { ...contact, stamp: stampAge(1_000) });
    await post(
      '/contacts',
      { ...contact, stamp: stampAge(5_000), eventId: crypto.randomUUID(), sourcePath: '/contact' },
      consent,
    );
    await settleNotifications();
    const rows = (await contactRows()).map((r) => `${r.status}:${r.spamReason}`).sort();
    expect(rows).toEqual(['new:null', 'spam:honeypot', 'spam:stamp', 'spam:too-fast']);
    expect(sent).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await db.select().from(enquiryPhotos)).toHaveLength(0);
  });
});

describe('GET /public/enquiry-stamp', () => {
  it('returns a fresh stamp that is never cached', async () => {
    const res = await call('/public/enquiry-stamp');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const { data } = await res.json();
    expect(data.stamp).toMatch(/^\d{13}\.[0-9a-f]{32}$/);
  });
});

describe('admin lists, stats and status changes', () => {
  const seed = async () => {
    await post('/quotes', { ...quote, stamp: stampAge(5_000) });
    await post('/quotes', { ...quote, website: 'bot' });
    await post('/contacts', { ...contact, stamp: stampAge(5_000) });
    await post('/contacts', { ...contact, website: 'bot' });
  };

  it('"all" excludes spam, "spam" lists only spam, stats count it apart', async () => {
    await seed();
    const owner = await sessionCookie('owner');
    for (const route of ['quotes', 'contacts']) {
      const all = await (await call(`/${route}/admin/list?status=all`, owner)).json();
      expect(all.data).toHaveLength(1);
      expect(all.data[0].status).toBe('new');
      const spam = await (await call(`/${route}/admin/list?status=spam`, owner)).json();
      expect(spam.data).toHaveLength(1);
      expect(spam.data[0]).toMatchObject({ status: 'spam', spamReason: 'honeypot' });
      const stats = (await (await call(`/${route}/admin/stats`, owner)).json()).data;
      expect(stats).toMatchObject({ all: 1, new: 1, spam: 1 });
    }
  });

  it('marking a plain quote as spam sets reason manual and audits; leaving spam clears it', async () => {
    const owner = await sessionCookie('owner');
    await post('/quotes', { ...quote, stamp: stampAge(5_000) });
    const [q] = await quoteRows();
    const res = await call(`/quotes/${q!.id}`, owner, { method: 'PATCH', body: { status: 'spam' } });
    expect(res.status).toBe(200);
    expect((await quoteRows())[0]).toMatchObject({ status: 'spam', spamReason: 'manual' });
    const audits = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, 'quote.update'))
      .orderBy(desc(auditLogs.createdAt));
    expect(audits).toHaveLength(1);
    expect(JSON.stringify(audits[0]!.diff)).toContain('spam');

    await call(`/quotes/${q!.id}`, owner, { method: 'PATCH', body: { status: 'new' } });
    expect((await quoteRows())[0]).toMatchObject({ status: 'new', spamReason: null });
  });

  it('same for a contact message', async () => {
    const owner = await sessionCookie('owner');
    await post('/contacts', { ...contact, stamp: stampAge(5_000) });
    const [c] = await contactRows();
    await call(`/contacts/${c!.id}`, owner, { method: 'PATCH', body: { status: 'spam' } });
    expect((await contactRows())[0]).toMatchObject({ status: 'spam', spamReason: 'manual' });
    await call(`/contacts/${c!.id}`, owner, { method: 'PATCH', body: { status: 'read' } });
    expect((await contactRows())[0]).toMatchObject({ status: 'read', spamReason: null });
  });

  it('refuses to mark a quote with billing data as spam', async () => {
    const owner = await sessionCookie('owner');
    const [q] = await db
      .insert(quoteRequests)
      .values({ ...quote, invoiceNumber: 'INV-1' })
      .returning();
    const res = await call(`/quotes/${q!.id}`, owner, { method: 'PATCH', body: { status: 'spam' } });
    expect(res.status).toBe(422);
    expect((await res.json()).error.message).toBe(
      "This quote has invoice or payment records, so it can't be marked as spam.",
    );
    expect((await quoteRows())[0]).toMatchObject({ status: 'new', spamReason: null });
    // Billing sent in the same patch counts too.
    const [p] = await db
      .insert(quoteRequests)
      .values({ ...quote })
      .returning();
    const same = await call(`/quotes/${p!.id}`, owner, { method: 'PATCH', body: { status: 'spam', paidAmount: 20 } });
    expect(same.status).toBe(422);
  });

  it('refuses a status change during View-as', async () => {
    const owner = await sessionCookie('owner');
    const intake = await createTestUser('intake');
    const [q] = await db.insert(quoteRequests).values(quote).returning();
    const viewing = await viewAsCookie(owner, intake.id);
    const res = await call(`/quotes/${q!.id}`, viewing, { method: 'PATCH', body: { status: 'spam' } });
    expect(res.status).toBe(403);
    expect((await quoteRows())[0]!.status).toBe('new');
  });
});

describe('retention', () => {
  it('does not count a 60-day-old spam quote that has billing data', async () => {
    const old = new Date(Date.now() - 60 * 86_400_000);
    await db.insert(quoteRequests).values([
      { ...quote, status: 'spam', paidAmount: '50.00', createdAt: old, updatedAt: old },
      { ...quote, status: 'spam', createdAt: old, updatedAt: old },
    ]);
    const result = await runRetention({ dryRun: true });
    expect(result.quotes.spam).toBe(1);
    const real = await runRetention();
    expect(real.quotes.spam).toBe(1);
    expect(await quoteRows()).toHaveLength(1);
  });
});
