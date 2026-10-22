import 'server-only';

import { after } from 'next/server';

import { parseGlobal } from '@/lib/content/globals';
import type { ContactMessage, QuoteRequest } from '@/server/db/schema';
import { headerText, singleAddress } from '@/server/lib/email/headers';
import { renderEmail } from '@/server/lib/email/layout';
import { sendMail, smtpConfigured, verifySmtp, type SendResult } from '@/server/lib/email/mailer';
import { settingsRepository } from '@/server/repositories/settings-repository';

type Enquiry = {
  kind: 'quote' | 'contact';
  name: string;
  email: string;
  phone: string;
  // Label/value rows shown to staff (never the free-text message).
  details: [string, string | null | undefined][];
  message: string | null | undefined;
  adminPath: string;
};

export type NotifyOutcome = {
  notification: SendResult | 'skipped';
  autoReply: SendResult | 'skipped';
};

const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');

// Settings are read straight from the table: this runs after the request, outside any cache scope.
const readSetting = async <K extends 'notifications' | 'contact'>(key: K) =>
  parseGlobal(key, (await settingsRepository.get(key))?.value);

// `{name}` in the editable auto-reply copy is replaced by the customer's name.
const fillName = (text: string, name: string) => text.replaceAll('{name}', name);

const failed = (r: SendResult | 'skipped') => r !== 'skipped' && !r.delivered && r.reason === 'send_failed';

export async function sendEnquiryEmails(enquiry: Enquiry): Promise<NotifyOutcome> {
  const [notifications, contact] = await Promise.all([readSetting('notifications'), readSetting('contact')]);
  const outcome: NotifyOutcome = { notification: 'skipped', autoReply: 'skipped' };

  const recipients = notifications.recipients.length ? notifications.recipients : [contact.email].filter(Boolean);
  const name = headerText(enquiry.name) || 'a visitor';
  const address = singleAddress(enquiry.email);

  if (recipients.length) {
    const noun = enquiry.kind === 'quote' ? 'quote request' : 'enquiry';
    const rows = enquiry.details.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`);
    const paragraphs = [`Name: ${enquiry.name}`, `Email: ${enquiry.email}`, `Phone: ${enquiry.phone}`, ...rows];
    if (notifications.includeMessage && enquiry.message) paragraphs.push(enquiry.message);
    const { html, text } = renderEmail({
      heading: `New ${noun}`,
      paragraphs,
      cta: { label: 'Open in the admin', url: `${appUrl()}${enquiry.adminPath}` },
    });
    outcome.notification = await sendMail({
      to: recipients,
      subject: headerText(`New ${noun} from ${name}`),
      html,
      text,
      replyTo: address,
    });
  }

  const reply = notifications.autoReply;
  if (address && reply.enabled && reply.subject) {
    // Never the enquiry text: the customer's own message is not echoed back.
    // Customer text never reaches the subject (the form lets anyone type any address), and the
    // greeting name is trimmed and capped; renderEmail escapes it.
    const subject = headerText(reply.subject.replaceAll('{name}', '').replace(/\s+/g, ' '));
    const greeting = headerText(enquiry.name).slice(0, 60);
    const paragraphs = fillName(reply.body, greeting)
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    const { html, text } = renderEmail({ heading: subject, paragraphs });
    outcome.autoReply = await sendMail({ to: address, subject, html, text });
  }

  if (failed(outcome.notification) || failed(outcome.autoReply)) {
    console.error('[enquiry-notify] delivery failed', { kind: enquiry.kind });
  }
  return outcome;
}

const quoteEnquiry = (row: QuoteRequest): Enquiry => ({
  kind: 'quote',
  name: row.name,
  email: row.email,
  phone: row.phone,
  details: [
    ['Service', row.serviceType],
    ['Vehicle', [row.make, row.model, row.year].filter(Boolean).join(' ')],
    ['Registration', row.registration],
  ],
  message: row.description,
  adminPath: '/dashboard/quotes',
});

const contactEnquiry = (row: ContactMessage): Enquiry => ({
  kind: 'contact',
  name: `${row.firstName} ${row.lastName}`.trim(),
  email: row.email,
  phone: row.phone,
  details: [['Service', row.service]],
  message: row.message,
  adminPath: '/dashboard/contacts',
});

// Runs after the response when Next provides a request scope, else as a detached promise.
// Errors are logged and never reach the caller: the enquiry is already saved.
const pending = new Set<Promise<void>>();

// Tests await this instead of sleeping: resolves once every queued notification has finished.
export const settleNotifications = async () => {
  await Promise.all([...pending]);
};

export function runAfterResponse(task: () => Promise<unknown>): void {
  let finish!: () => void;
  const done = new Promise<void>((resolve) => (finish = resolve));
  pending.add(done);
  const guarded = async () => {
    try {
      await task();
    } catch (error) {
      console.error('[enquiry-notify] failed:', error instanceof Error ? error.message : 'unknown error');
    } finally {
      pending.delete(done);
      finish();
    }
  };
  try {
    after(guarded);
  } catch {
    void guarded();
  }
}

export const notifyNewQuote = (row: QuoteRequest) => runAfterResponse(() => sendEnquiryEmails(quoteEnquiry(row)));
export const notifyNewContact = (row: ContactMessage) => runAfterResponse(() => sendEnquiryEmails(contactEnquiry(row)));

export type TestEmailResult =
  { status: 'not_configured' } | { status: 'sent'; to: string } | { status: 'failed'; error: string };

// "Send test email" on the Notifications page: checks the SMTP connection, then mails the person who asked.
export async function sendTestEmail(to: string): Promise<TestEmailResult> {
  if (!smtpConfigured()) return { status: 'not_configured' };
  const verified = await verifySmtp();
  if (!verified.ok) return { status: 'failed', error: verified.error ?? 'SMTP connection failed' };
  const { html, text } = renderEmail({
    heading: 'Test email',
    paragraphs: ['This is a test from the Notifications settings. If you can read it, enquiry emails can be sent.'],
  });
  const result = await sendMail({ to, subject: 'Test email from your site', html, text });
  return result.delivered
    ? { status: 'sent', to }
    : {
        status: 'failed',
        error: result.reason === 'send_failed' ? (result.error ?? 'Send failed') : 'SMTP not configured',
      };
}
