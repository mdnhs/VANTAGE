import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import { eq, sql } from 'drizzle-orm';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { auditLogs, contactMessages, quoteRequests, siteSettings } from '@/server/db/schema';
import { resetMailerForTests } from '@/server/lib/email/mailer';
import { settingsRepository } from '@/server/repositories/settings-repository';
import { contactMessageService } from '@/server/services/contact-message-service';
import { sendEnquiryEmails, settleNotifications } from '@/server/services/enquiry-notify';
import { quoteRequestService } from '@/server/services/quote-request-service';

import { call, createTestUser, signInCookie, stamped } from '../support/session';

const QUOTE = {
  name: 'Pat Murphy',
  email: 'pat@example.com',
  phone: '0871234567',
  description: 'SECRET-DAMAGE-TEXT scrape on the wing',
  serviceType: 'Dent removal',
  make: 'BMW',
  model: '3 Series',
} as never;

const smtp = () => {
  vi.stubEnv('SMTP_HOST', 'smtp.example.com');
  vi.stubEnv('MAIL_FROM', 'Shop <no-reply@example.com>');
};

// A real nodemailer transport that records instead of delivering.
const transport = () => {
  const t = nodemailer.createTransport({ jsonTransport: true });
  const sent: { to: string[]; subject: string; text: string; html: string; replyTo?: string }[] = [];
  vi.spyOn(t, 'sendMail').mockImplementation((async (m: Record<string, unknown>) => {
    sent.push({
      to: ([] as string[]).concat(m.to as never),
      subject: String(m.subject),
      text: String(m.text),
      html: String(m.html),
      replyTo: m.replyTo as string | undefined,
    });
    return { messageId: 'id-1' };
  }) as never);
  resetMailerForTests(t);
  return sent;
};

const saveSetting = (key: string, value: unknown) => settingsRepository.save(key, { version: 0, value }, null);

beforeEach(async () => {
  await db.execute(
    sql`truncate table settings, site_settings, revisions, audit_logs, enquiry_photos, quote_requests, contact_messages`,
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  resetMailerForTests();
});

describe('SMTP not configured', () => {
  it('a public quote still saves and returns 201; nothing is sent, nothing throws', async () => {
    const res = await call('/quotes', undefined, {
      method: 'POST',
      body: stamped({ name: 'Pat', email: 'pat@example.com', phone: '0871234567' }),
    });
    expect(res.status).toBe(201);
    expect(await db.select().from(quoteRequests)).toHaveLength(1);
  });

  it('a public contact message still saves and returns 201', async () => {
    const res = await call('/contacts', undefined, {
      method: 'POST',
      body: stamped({
        firstName: 'Pat',
        lastName: 'M',
        email: 'pat@example.com',
        phone: '0871234567',
        message: 'Hello there',
      }),
    });
    expect(res.status).toBe(201);
    expect(await db.select().from(contactMessages)).toHaveLength(1);
  });

  it('sendEnquiryEmails reports nothing delivered and does not throw', async () => {
    await saveSetting('notifications', { recipients: ['staff@example.com'] });
    const row = await quoteRequestService.create(
      { name: 'Pat', email: 'p@example.com', phone: '0871234567' } as never,
      { notify: false },
    );
    const outcome = await sendEnquiryEmails({
      id: randomUUID(),
      kind: 'quote',
      name: row!.name,
      email: row!.email,
      phone: row!.phone,
      details: [],
      message: null,
      adminPath: '/dashboard/quotes',
    });
    expect(outcome.notification).toEqual({ delivered: false, reason: 'smtp_not_configured' });
  });
});

describe('SMTP configured (injected transport)', () => {
  beforeEach(smtp);

  it('mails the recipients without the message, and auto-replies to the customer without it', async () => {
    const sent = transport();
    await saveSetting('notifications', {
      recipients: ['staff@example.com', 'boss@example.com'],
      autoReply: { enabled: true, subject: 'Thanks {name}', body: 'Hi {name},\n\nWe will be in touch soon.' },
    });
    await quoteRequestService.create(QUOTE);
    await settleNotifications();
    expect(sent).toHaveLength(2);

    const note = sent.find((m) => m.to.includes('staff@example.com'))!;
    expect(note.to).toEqual(['staff@example.com', 'boss@example.com']);
    expect(note.subject).toBe('New quote request from Pat Murphy');
    expect(note.replyTo).toBe('pat@example.com');
    expect(note.text).toContain('Dent removal');
    expect(note.text).toContain('BMW 3 Series');
    expect(note.text + note.html).not.toContain('SECRET-DAMAGE-TEXT');

    const reply = sent.find((m) => m.to.includes('pat@example.com'))!;
    expect(reply.subject).toBe('Thanks');
    expect(reply.text).toContain('Hi Pat Murphy,');
    expect(reply.text + reply.html).not.toContain('SECRET-DAMAGE-TEXT');
    expect(reply.text + reply.html).not.toContain('scrape');
  });

  it('puts the message in the notification only when includeMessage is on; never in the auto-reply', async () => {
    const sent = transport();
    await saveSetting('notifications', {
      recipients: ['staff@example.com'],
      includeMessage: true,
      autoReply: { enabled: true, subject: 'Thanks', body: 'We got it.' },
    });
    await quoteRequestService.create(QUOTE);
    await settleNotifications();
    expect(sent).toHaveLength(2);
    const note = sent.find((m) => m.to.includes('staff@example.com'))!;
    const reply = sent.find((m) => m.to.includes('pat@example.com'))!;
    expect(note.text).toContain('SECRET-DAMAGE-TEXT');
    expect(reply.text + reply.html).not.toContain('SECRET-DAMAGE-TEXT');
  });

  it('falls back to the contact email when there are no recipients; no auto-reply when disabled', async () => {
    const sent = transport();
    await saveSetting('contact', { email: 'hello@shop.ie' });
    await contactMessageService.create({
      firstName: 'Ann',
      lastName: 'Byrne',
      email: 'ann@example.com',
      phone: '0871234567',
      message: 'CONTACT-BODY please call',
      source: 'contact_page',
    } as never);
    await settleNotifications();
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toEqual(['hello@shop.ie']);
    expect(sent[0]!.subject).toBe('New enquiry from Ann Byrne');
    expect(sent[0]!.text).not.toContain('CONTACT-BODY');
  });

  it('falls back to the schema default contact email when the contact key was never saved, ignoring legacy site_settings', async () => {
    const sent = transport();
    await db.insert(siteSettings).values({
      id: 1,
      email: 'legacy@shop.ie',
      phone: '01 234 5678',
      address: '1 Main St',
      businessName: 'Shop',
      openingHours: 'Mon-Fri',
    });
    await contactMessageService.create({
      firstName: 'Ann',
      lastName: 'Byrne',
      email: 'ann@example.com',
      phone: '0871234567',
      message: 'hi',
      source: 'contact_page',
    } as never);
    await settleNotifications();
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toEqual(['info@vantageautobody.ie']);
  });

  it('escapes customer data in html and keeps line breaks out of headers', async () => {
    const sent = transport();
    await saveSetting('notifications', { recipients: ['staff@example.com'] });
    const outcome = await sendEnquiryEmails({
      id: randomUUID(),
      kind: 'contact',
      name: 'Eve <script>alert(1)</script>\r\nBcc: evil@example.com',
      email: 'eve@example.com',
      phone: '1',
      details: [],
      message: null,
      adminPath: '/dashboard/contacts',
    });
    expect(outcome.notification).toMatchObject({ delivered: true });
    expect(sent[0]!.html).not.toContain('<script>');
    expect(sent[0]!.html).toContain('&lt;script&gt;');
    expect(sent[0]!.subject).not.toMatch(/[\r\n]/);
  });

  it('a failing transport never fails the quote request', async () => {
    const t = nodemailer.createTransport({ jsonTransport: true });
    vi.spyOn(t, 'sendMail').mockRejectedValue(new Error('boom'));
    resetMailerForTests(t);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await saveSetting('notifications', { recipients: ['staff@example.com'] });
    const res = await call('/quotes', undefined, {
      method: 'POST',
      body: stamped({ name: 'Pat', email: 'pat@example.com', phone: '0871234567' }),
    });
    expect(res.status).toBe(201);
    await settleNotifications();
    expect(t.sendMail).toHaveBeenCalled();
  });

  it('staff-entered quotes (/quotes/admin) send nothing', async () => {
    const sent = transport();
    await saveSetting('notifications', { recipients: ['staff@example.com'] });
    const owner = await createTestUser('owner');
    const res = await call('/quotes/admin', await signInCookie(owner.email), {
      method: 'POST',
      body: { name: 'Walk In', email: 'w@example.com', phone: '0871234567' },
    });
    expect(res.status).toBe(201);
    await settleNotifications();
    expect(sent).toHaveLength(0);
  });
});

const failureRows = () => db.select().from(auditLogs).where(eq(auditLogs.action, 'enquiry.delivery_failed'));

// Rejects the team notification (subject starts "New quote request"); everything else records.
const flakyTransport = (rejectAll = false) => {
  const t = nodemailer.createTransport({ jsonTransport: true });
  const sent: { to: string[]; subject: string; text: string }[] = [];
  vi.spyOn(t, 'sendMail').mockImplementation((async (m: Record<string, unknown>) => {
    const subject = String(m.subject);
    if (rejectAll || subject.startsWith('New quote request')) throw new Error('boom');
    sent.push({ to: ([] as string[]).concat(m.to as never), subject, text: String(m.text) });
    return { messageId: 'id-1' };
  }) as never);
  resetMailerForTests(t);
  return sent;
};

describe('delivery failure', () => {
  beforeEach(smtp);

  it('delivery failure -> bell row + owner alert', async () => {
    const owner = await createTestUser('owner');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const sent = flakyTransport();
    await saveSetting('notifications', { recipients: ['staff@example.com'] });
    const row = (await quoteRequestService.create(QUOTE))!;
    await settleNotifications();
    const rows = await failureRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      entityType: 'quote',
      entityId: row.id,
      actorId: null,
    });
    const dump = JSON.stringify(rows[0]);
    expect(dump).not.toContain('SECRET-DAMAGE-TEXT');
    expect(dump).not.toContain('pat@example.com');
    const alert = sent.find((m) => m.to.includes(owner.email))!;
    expect(alert.subject).toBe('Email delivery failed: the new-enquiry notification');
    expect(alert.text).toContain(`/dashboard/quotes/${row.id}`);
  });

  it('alert failure never loops', async () => {
    await createTestUser('owner');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    flakyTransport(true);
    await saveSetting('notifications', { recipients: ['staff@example.com'] });
    await quoteRequestService.create(QUOTE);
    await settleNotifications();
    expect(await failureRows()).toHaveLength(1);

    await db.execute(sql`truncate table audit_logs, settings, revisions`);
    await saveSetting('notifications', {
      recipients: ['staff@example.com'],
      autoReply: { enabled: true, subject: 'Thanks', body: 'Hi' },
    });
    await quoteRequestService.create(QUOTE);
    await settleNotifications();
    expect(await failureRows()).toHaveLength(2);
  });

  it('SMTP not configured -> no failure row', async () => {
    vi.unstubAllEnvs();
    resetMailerForTests();
    await createTestUser('owner');
    await saveSetting('notifications', { recipients: ['staff@example.com'] });
    await quoteRequestService.create(QUOTE);
    await settleNotifications();
    expect(await failureRows()).toHaveLength(0);
  });

  it('new-enquiry CTA deep-links the record', async () => {
    const sent = transport();
    await saveSetting('notifications', { recipients: ['staff@example.com'] });
    const quote = (await quoteRequestService.create(QUOTE))!;
    const contact = (await contactMessageService.create({
      firstName: 'Ann',
      lastName: 'Byrne',
      email: 'ann@example.com',
      phone: '0871234567',
      message: 'hi',
      source: 'contact_page',
    } as never))!;
    await settleNotifications();
    expect(sent.find((m) => m.subject.startsWith('New quote'))!.text).toContain(`/dashboard/quotes/${quote.id}`);
    expect(sent.find((m) => m.subject.startsWith('New enquiry'))!.text).toContain(`/dashboard/contacts/${contact.id}`);
  });
});

describe('auto-reply relay safety', () => {
  beforeEach(smtp);
  it('keeps customer text out of the subject and caps the greeting at 60 characters', async () => {
    const sent = transport();
    await saveSetting('notifications', { autoReply: { enabled: true, subject: 'Hello {name}', body: 'Hi {name}' } });
    const long = 'A'.repeat(100);
    const outcome = await sendEnquiryEmails({
      id: randomUUID(),
      kind: 'quote',
      name: `${long}<b>`,
      email: 'v@example.com',
      phone: '1',
      details: [],
      message: null,
      adminPath: '/x',
    });
    expect(outcome.autoReply).toMatchObject({ delivered: true });
    const reply = sent.find((m) => m.to.includes('v@example.com'))!;
    expect(reply.subject).toBe('Hello');
    expect(reply.text).toContain(`Hi ${'A'.repeat(60)}`);
    expect(reply.text).not.toContain('A'.repeat(61));
  });
});

describe('auto-reply subject punctuation', () => {
  beforeEach(smtp);
  it('"Thanks {name}!" becomes "Thanks!"', async () => {
    const sent = transport();
    await saveSetting('notifications', { autoReply: { enabled: true, subject: 'Thanks {name}!', body: 'Hi' } });
    await sendEnquiryEmails({
      id: randomUUID(),
      kind: 'quote',
      name: 'Pat',
      email: 'v@example.com',
      phone: '1',
      details: [],
      message: null,
      adminPath: '/x',
    });
    expect(sent.find((m) => m.to.includes('v@example.com'))!.subject).toBe('Thanks!');
  });
});

describe('POST /admin/globals/notifications/test', () => {
  let owner: string;
  let viewer: string;
  let ownerEmail: string;
  beforeAll(async () => {
    const o = await createTestUser('owner');
    ownerEmail = o.email;
    owner = await signInCookie(o.email);
    viewer = await signInCookie((await createTestUser('viewer')).email);
  });
  const post = (cookie?: string) => call('/admin/globals/notifications/test', cookie, { method: 'POST' });

  it('needs sign-in and settings.update', async () => {
    expect((await post()).status).toBe(401);
    expect((await post(viewer)).status).toBe(403);
  });

  it('reports SMTP not configured', async () => {
    const res = await post(owner);
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ status: 'not_configured' });
  });

  it('verifies the connection and mails the signed-in person', async () => {
    smtp();
    const sent = transport();
    const t = nodemailer.createTransport({ jsonTransport: true });
    vi.spyOn(t, 'verify').mockResolvedValue(true as never);
    vi.spyOn(t, 'sendMail').mockImplementation((async (m: Record<string, unknown>) => {
      sent.push({ to: [String(m.to)], subject: String(m.subject), text: '', html: '' });
      return { messageId: 'x' };
    }) as never);
    resetMailerForTests(t);
    const res = await post(owner);
    expect((await res.json()).data).toEqual({ status: 'sent', to: ownerEmail });
    expect(sent.at(-1)!.to).toEqual([ownerEmail]);
  });

  it('rate-limits repeated sends', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 8; i++) statuses.push((await post(owner)).status);
    expect(statuses).toContain(429);
  });
});
