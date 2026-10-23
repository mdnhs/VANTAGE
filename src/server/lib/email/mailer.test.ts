import nodemailer from 'nodemailer';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderEmail } from '@/server/lib/email/layout';
import { resetMailerForTests, sendMail, smtpConfigured, verifySmtp } from '@/server/lib/email/mailer';

const msg = {
  to: 'a@example.com',
  subject: 'Hi',
  html: '<p>hi</p>',
  text: 'hi',
};

const configure = () => {
  vi.stubEnv('SMTP_HOST', 'smtp.example.com');
  vi.stubEnv('MAIL_FROM', 'VANTAGE <no-reply@example.com>');
};

afterEach(() => {
  vi.unstubAllEnvs();
  resetMailerForTests();
});

describe('mailer without SMTP', () => {
  it('is not configured and does not deliver', async () => {
    expect(smtpConfigured()).toBe(false);
    expect(await sendMail(msg)).toEqual({
      delivered: false,
      reason: 'smtp_not_configured',
    });
    expect((await verifySmtp()).ok).toBe(false);
  });
});

describe('mailer with SMTP', () => {
  it('requires both host and from', () => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.com');
    expect(smtpConfigured()).toBe(false);
    vi.stubEnv('MAIL_FROM', 'x@example.com');
    expect(smtpConfigured()).toBe(true);
  });

  it('delivers through an injected transport', async () => {
    configure();
    resetMailerForTests(nodemailer.createTransport({ jsonTransport: true }));
    const res = await sendMail({ ...msg, replyTo: 'r@example.com' });
    expect(res.delivered).toBe(true);
    if (res.delivered) expect(res.messageId).toBeTruthy();
  });

  it('returns send_failed without throwing or logging credentials', async () => {
    configure();
    vi.stubEnv('SMTP_PASS', 'super-secret');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    resetMailerForTests({
      sendMail: () => Promise.reject(new Error('boom')),
    } as never);
    const res = await sendMail(msg);
    expect(res).toMatchObject({
      delivered: false,
      reason: 'send_failed',
      error: 'boom',
    });
    expect(JSON.stringify(spy.mock.calls)).not.toContain('super-secret');
    spy.mockRestore();
  });

  it('caps the returned error at 300 chars, matching the log', async () => {
    configure();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    resetMailerForTests({ sendMail: () => Promise.reject(new Error('x'.repeat(1000))) } as never);
    const res = await sendMail(msg);
    expect(res.delivered === false && res.error).toHaveLength(300);
    spy.mockRestore();
    resetMailerForTests({ verify: () => Promise.reject(new Error('y'.repeat(1000))) } as never);
    expect((await verifySmtp()).error).toHaveLength(300);
  });

  it('verifySmtp reports transport errors', async () => {
    configure();
    resetMailerForTests({
      verify: () => Promise.reject(new Error('nope')),
    } as never);
    expect(await verifySmtp()).toEqual({ ok: false, error: 'nope' });
  });
});

describe('mailer with malformed env', () => {
  it('never throws on an invalid env', async () => {
    configure();
    vi.stubEnv('SMTP_PORT', 'abc');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(smtpConfigured()).toBe(false);
    const res = await sendMail(msg);
    expect(res).toMatchObject({ delivered: false, reason: 'send_failed' });
    expect(JSON.stringify(res)).not.toContain('abc');
    expect(await verifySmtp()).toMatchObject({ ok: false });
    spy.mockRestore();
  });
});

describe('renderEmail', () => {
  it('escapes HTML in heading, paragraphs and cta label', () => {
    const { html, text } = renderEmail({
      heading: '<h1>x</h1>',
      paragraphs: ['<script>alert(1)</script>'],
      cta: { label: '<b>Go</b>', url: 'https://example.com/?a=1&b="2"' },
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>Go</b>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp;b=%222%22');
    expect(text).toContain('https://example.com/');
  });

  it('omits the CTA for non-http(s) urls', () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,x', '/relative']) {
      const { html, text } = renderEmail({
        heading: 'H',
        paragraphs: ['p'],
        cta: { label: 'Go', url },
      });
      expect(html).not.toContain('href');
      expect(text).not.toContain(url);
    }
  });
});
