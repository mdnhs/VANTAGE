import 'server-only';

import type { SupportConversation } from '@/server/db/schema';
import { renderEmail } from '@/server/lib/email/layout';
import { sendMail } from '@/server/lib/email/mailer';
import { createBudget } from '@/server/lib/support/limits';
import { supportRepository } from '@/server/repositories/support-repository';
import { readEffectiveGlobal } from '@/server/services/globals-service';

// Site-wide ceiling on top of the per-IP limits, for a flood spread across many addresses.
const teamEmailBudget = createBudget(20, 60 * 60_000);

const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
export const inboxUrl = (id: string) => `${appUrl()}/dashboard/support?c=${id}`;

// Emails the notification recipients (or the contact address) and the agent holding the chat.
export async function emailTeam(
  row: SupportConversation,
  { subject, heading, paragraphs }: { subject: string; heading: string; paragraphs: string[] },
) {
  if (!teamEmailBudget.take()) {
    console.error('[support] team email budget reached');
    return;
  }
  const [notifications, contact, assignee] = await Promise.all([
    readEffectiveGlobal('notifications').then((s) => s.value),
    readEffectiveGlobal('contact').then((s) => s.value),
    row.assignedTo ? supportRepository.staffById(row.assignedTo) : undefined,
  ]);
  const team = notifications.recipients.length ? notifications.recipients : [contact.email].filter(Boolean);
  const to = [...new Set([...team, ...(assignee ? [assignee.email] : [])])];
  if (!to.length) return;
  const { html, text } = renderEmail({
    heading,
    paragraphs: [
      ...paragraphs,
      ...(notifications.includeMessage && row.lastMessagePreview ? [row.lastMessagePreview] : []),
    ],
    cta: { label: 'Open the chat', url: inboxUrl(row.id) },
  });
  await sendMail({ to, subject, html, text });
}

// The AI could not help (or hit its limit): tell the team once.
export async function notifyTeamNeedsHuman(id: string) {
  const row = await supportRepository.byId(id);
  if (!row || row.status !== 'open') return;
  await emailTeam(row, {
    subject: 'A website visitor needs a person',
    heading: 'A visitor needs a person',
    paragraphs: ['The AI assistant could not fully help a visitor in the website chat. Please take over the chat.'],
  });
}
