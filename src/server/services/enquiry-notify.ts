import 'server-only';

import { and, eq, like } from 'drizzle-orm';
import { after } from 'next/server';

import { db } from '@/server/db';
import { users, type ContactMessage, type QuoteRequest } from '@/server/db/schema';
import { headerText, singleAddress } from '@/server/lib/email/headers';
import { renderEmail } from '@/server/lib/email/layout';
import { sendMail, smtpConfigured, verifySmtp, type SendResult } from '@/server/lib/email/mailer';
import { notify } from '@/server/lib/notifications/notify';
import { readEffectiveGlobal } from '@/server/services/globals-service';

type Enquiry = {
  id: string;
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

// Read straight from the table (this runs after the request, outside any cache scope), with the same
// legacy-aware fallback the public site and the editor use: stored row, else legacy-derived, else defaults.
const readSetting = async <K extends 'notifications' | 'contact'>(key: K) => (await readEffectiveGlobal(key)).value;

// `{name}` in the editable auto-reply copy is replaced by the customer's name.
const fillName = (text: string, name: string) => text.replaceAll('{name}', name);

const failed = (r: SendResult | 'skipped') => r !== 'skipped' && !r.delivered && r.reason === 'send_failed';

type Channel = 'notification' | 'auto_reply';

// MK `alertOwners`: tell every active owner that an enquiry email could not be sent. A failure here is
// logged and swallowed: no notify, no retry (the bell item for the original failure already exists).
async function alertOwners(enquiry: Enquiry, channel: Channel): Promise<void> {
  try {
    const owners = await db
      .select({ email: users.email })
      .from(users)
      .where(and(like(users.role, '%owner%'), eq(users.banned, false)));
    if (!owners.length) return;
    const label = channel === 'notification' ? 'the new-enquiry notification' : 'the auto-reply to the visitor';
    const { html, text } = renderEmail({
      heading: 'Email delivery failed',
      paragraphs: [
        `We could not send ${label} (at ${new Date().toISOString()}). The enquiry itself is saved. Open it in the admin to follow up.`,
      ],
      cta: { label: 'Open the enquiry', url: `${appUrl()}${enquiry.adminPath}` },
    });
    const result = await sendMail({
      to: owners.map((o) => o.email),
      subject: `Email delivery failed: ${label}`,
      html,
      text,
    });
    if (failed(result)) console.error('[enquiry-notify] delivery-failure alert failed');
  } catch {
    console.error('[enquiry-notify] delivery-failure alert failed');
  }
}

async function onFailure(enquiry: Enquiry, channel: Channel): Promise<void> {
  await notify('delivery_failed', { enquiry: enquiry.kind, enquiryId: enquiry.id, channel });
  await alertOwners(enquiry, channel);
}

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
    const subject = headerText(reply.subject.replaceAll('{name}', '').replace(/\s+([!?.,:;])/g, '$1'));
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
    if (failed(outcome.notification)) await onFailure(enquiry, 'notification');
    if (failed(outcome.autoReply)) await onFailure(enquiry, 'auto_reply');
  }
  return outcome;
}

const quoteEnquiry = (row: Omit<QuoteRequest, 'photoUrls'>): Enquiry => ({
  id: row.id,
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
  adminPath: `/dashboard/quotes/${row.id}`,
});

const contactEnquiry = (row: Omit<ContactMessage, 'photoUrls'>): Enquiry => ({
  id: row.id,
  kind: 'contact',
  name: `${row.firstName} ${row.lastName}`.trim(),
  email: row.email,
  phone: row.phone,
  details: [['Service', row.service]],
  message: row.message,
  adminPath: `/dashboard/contacts/${row.id}`,
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

export const notifyNewQuote = (row: Omit<QuoteRequest, 'photoUrls'>) =>
  runAfterResponse(() => sendEnquiryEmails(quoteEnquiry(row)));
export const notifyNewContact = (row: Omit<ContactMessage, 'photoUrls'>) =>
  runAfterResponse(() => sendEnquiryEmails(contactEnquiry(row)));

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
