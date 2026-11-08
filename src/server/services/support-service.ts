import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

import { parseGlobal } from '@/lib/content/globals';
import { hasPermission, parseRoles } from '@/lib/auth/permissions';
import type {
  SupportAgentDto,
  SupportDetailDto,
  SupportListItemDto,
  SupportMessageDto,
  SupportSender,
  SupportStatus,
  VisitorConversationDto,
} from '@/lib/support/types';
import type { SupportConversation } from '@/server/db/schema';
import type { Actor } from '@/server/lib/auth/actor';
import { isBanned } from '@/server/lib/auth/fresh-session';
import { renderEmail } from '@/server/lib/email/layout';
import { sendMail } from '@/server/lib/email/mailer';
import { ApiError } from '@/server/lib/errors';
import { createBudget, createNoReplyTimers } from '@/server/lib/support/limits';
import { agentsOnline, isAgentOnline, publishSupportEvent } from '@/server/lib/support/realtime';
import { settingsRepository } from '@/server/repositories/settings-repository';
import { supportRepository, type SupportListRow } from '@/server/repositories/support-repository';
import { runAfterResponse } from '@/server/services/enquiry-notify';
import { readEffectiveGlobal } from '@/server/services/globals-service';
import { retentionCutoffs } from '@/server/services/retention-service';
import type { SupportListQuery, SupportStartInput, SupportVisitorContactInput } from '@/validations/support-schema';

const CLOSED = 'This chat has ended';
const NO_REPLY_MINUTES = 5;

// Site-wide ceilings on top of the per-IP limits, for a flood spread across many addresses.
const newChatBudget = createBudget(60, 10 * 60_000);
const teamEmailBudget = createBudget(20, 60 * 60_000);

const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
const inboxUrl = (id: string) => `${appUrl()}/dashboard/support?c=${id}`;
const firstName = (name: string | null | undefined) => name?.trim().split(/\s+/)[0] || null;
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

// Support agents see their own chats; anyone who can assign sees all of them.
const canSeeAll = (actor: Actor) => hasPermission(actor.roles, { support: ['assign'] });
const ownScope = (actor: Actor) => (canSeeAll(actor) ? null : actor.userId);

type MessageRow = { id: string; sender: string; senderName: string | null; body: string; createdAt: Date };

const toMessage = (row: MessageRow, senderName = row.senderName): SupportMessageDto => ({
  id: row.id,
  sender: row.sender as SupportSender,
  senderName,
  body: row.body,
  createdAt: row.createdAt.toISOString(),
});

const toListItem = (row: SupportListRow): SupportListItemDto => ({
  id: row.id,
  status: row.status as SupportStatus,
  visitorName: row.visitorName,
  visitorEmail: row.visitorEmail,
  assignedTo: row.assignedTo,
  assigneeName: row.assigneeName,
  preview: row.preview,
  lastMessageAt: row.lastMessageAt.toISOString(),
  unread: Boolean(row.unread),
});

async function visitorView(row: SupportConversation): Promise<VisitorConversationDto> {
  const [detail, messages] = await Promise.all([supportRepository.detail(row.id), supportRepository.messages(row.id)]);
  return {
    id: row.id,
    status: row.status as SupportStatus,
    agentName: firstName(detail?.assigneeName),
    hasEmail: Boolean(row.visitorEmail),
    // Visitors only ever get an agent's first name.
    messages: messages.map((m) => toMessage(m, firstName(m.senderName))),
  };
}

// Tells the team (and the agent holding the chat) that a visitor has been left waiting.
async function alertIfUnanswered(id: string) {
  if (!teamEmailBudget.take()) {
    console.error('[support] team email budget reached');
    return;
  }
  const row = await supportRepository.claimNoReplyAlert(id);
  if (!row) return;
  const [notifications, contact, assignee] = await Promise.all([
    readEffectiveGlobal('notifications').then((s) => s.value),
    readEffectiveGlobal('contact').then((s) => s.value),
    row.assignedTo ? supportRepository.staffById(row.assignedTo) : undefined,
  ]);
  const team = notifications.recipients.length ? notifications.recipients : [contact.email].filter(Boolean);
  const to = [...new Set([...team, ...(assignee ? [assignee.email] : [])])];
  if (!to.length) return;
  const { html, text } = renderEmail({
    heading: 'A visitor is waiting for a reply',
    paragraphs: [
      `A website chat has had no reply for ${NO_REPLY_MINUTES} minutes.`,
      ...(notifications.includeMessage && row.lastMessagePreview ? [row.lastMessagePreview] : []),
    ],
    cta: { label: 'Open the chat', url: inboxUrl(row.id) },
  });
  await sendMail({ to, subject: 'A website visitor is waiting for a reply', html, text });
}

const noReplyTimers = createNoReplyTimers(NO_REPLY_MINUTES * 60_000, (id) => {
  alertIfUnanswered(id).catch(() => console.error('[support] no-reply alert failed'));
});

function emailAgentAboutAssignment(email: string, conversationId: string) {
  runAfterResponse(async () => {
    const { html, text } = renderEmail({
      heading: 'A chat was assigned to you',
      paragraphs: ['A website visitor is waiting for a reply.'],
      cta: { label: 'Open the chat', url: inboxUrl(conversationId) },
    });
    await sendMail({ to: [email], subject: 'A website chat was assigned to you', html, text });
  });
}

async function requireVisible(actor: Actor, id: string) {
  const row = await supportRepository.byId(id);
  // Not 403: a support agent should not learn that someone else's chat exists.
  if (!row || (!canSeeAll(actor) && row.assignedTo !== actor.userId)) throw ApiError.notFound('Chat not found');
  return row;
}

const requireOpen = (row: SupportConversation) => {
  if (row.status !== 'open') throw ApiError.conflict(CLOSED);
};

async function applyAssignment(id: string, userId: string | null, joinedName: string | null) {
  const notice = userId && joinedName ? `${firstName(joinedName)} joined the chat.` : null;
  const { outcome, previous } = await supportRepository.assign(id, userId, notice);
  if (outcome === 'closed') throw ApiError.conflict(CLOSED);
  if (outcome === 'unchanged') return;
  if (notice) await publishSupportEvent({ type: 'message', conversationId: id, assignedTo: userId, from: 'system' });
  await publishSupportEvent({ type: 'conversation', conversationId: id, assignedTo: userId });
  // The previous agent's inbox has to drop the chat too.
  if (previous && previous !== userId) {
    await publishSupportEvent({ type: 'conversation', conversationId: id, assignedTo: previous });
  }
}

export const supportService = {
  status: () => ({ online: agentsOnline() }),

  byVisitorToken: async (token: string | undefined) =>
    token ? supportRepository.byTokenHash(hashToken(token)) : undefined,

  visitorConversation: visitorView,

  alertIfUnanswered,

  async start({ body, name, sourcePath }: Omit<SupportStartInput, 'website'>) {
    if (!newChatBudget.take()) throw new ApiError('SERVICE_UNAVAILABLE', 'Chat is busy, please try again soon', 503);
    const token = randomBytes(32).toString('base64url');
    const row = await supportRepository.create({
      tokenHash: hashToken(token),
      body,
      visitorName: name,
      sourcePath,
    });
    await publishSupportEvent({ type: 'conversation', conversationId: row.id, assignedTo: null });
    await publishSupportEvent({ type: 'message', conversationId: row.id, assignedTo: null, from: 'visitor' });
    noReplyTimers.schedule(row.id);
    return { token, conversation: await visitorView(row) };
  },

  async visitorSend(row: SupportConversation, body: string) {
    requireOpen(row);
    if (!(await supportRepository.addMessage({ conversationId: row.id, sender: 'visitor', body }))) {
      throw ApiError.conflict(CLOSED);
    }
    await publishSupportEvent({ type: 'message', conversationId: row.id, assignedTo: row.assignedTo, from: 'visitor' });
    noReplyTimers.schedule(row.id);
    const fresh = await supportRepository.byId(row.id);
    return visitorView(fresh ?? row);
  },

  async visitorContact(row: SupportConversation, input: SupportVisitorContactInput) {
    await supportRepository.setVisitorContact(row.id, input);
    await publishSupportEvent({ type: 'conversation', conversationId: row.id, assignedTo: row.assignedTo });
    return { hasEmail: true };
  },

  canSeeAll,

  async list(actor: Actor, query: SupportListQuery) {
    const { rows, hasMore } = await supportRepository.list(query, ownScope(actor));
    return { items: rows.map(toListItem), hasMore };
  },

  unread: async (actor: Actor) => ({ count: await supportRepository.unreadCount(ownScope(actor)) }),

  async detail(actor: Actor, id: string): Promise<SupportDetailDto> {
    await requireVisible(actor, id);
    const [row, messages] = await Promise.all([supportRepository.detail(id), supportRepository.messages(id)]);
    if (!row) throw ApiError.notFound('Chat not found');
    return {
      ...toListItem(row),
      sourcePath: row.sourcePath,
      createdAt: row.createdAt.toISOString(),
      messages: messages.map((m) => toMessage(m)),
    };
  },

  async staffSend(actor: Actor, id: string, body: string) {
    const row = await requireVisible(actor, id);
    requireOpen(row);
    // The first person to answer an unassigned chat takes it.
    if (!row.assignedTo) await applyAssignment(id, actor.userId, actor.name);
    const assignedTo = row.assignedTo ?? actor.userId;
    const message = await supportRepository.addMessage({
      conversationId: id,
      sender: 'staff',
      body,
      senderUserId: actor.userId,
      senderName: actor.name,
    });
    if (!message) throw ApiError.conflict(CLOSED);
    noReplyTimers.cancel(id);
    await publishSupportEvent({ type: 'message', conversationId: id, assignedTo, from: 'staff' });
    return toMessage(message);
  },

  async markRead(actor: Actor, id: string) {
    const row = await requireVisible(actor, id);
    // An admin looking in must not clear the badge of the agent who holds the chat.
    if (row.assignedTo && row.assignedTo !== actor.userId) return { read: false };
    await supportRepository.markRead(id);
    return { read: true };
  },

  async assign(actor: Actor, id: string, userId: string | null) {
    const row = await requireVisible(actor, id);
    requireOpen(row);
    if (row.assignedTo === userId) return { assignedTo: userId };
    if (!userId) {
      await applyAssignment(id, null, null);
      return { assignedTo: null };
    }
    const target = await supportRepository.staffById(userId);
    if (!target || isBanned(target) || !hasPermission(parseRoles(target.role), { support: ['reply'] })) {
      throw ApiError.conflict('That person cannot take live chats');
    }
    await applyAssignment(id, userId, target.name);
    if (userId !== actor.userId && !isAgentOnline(userId)) emailAgentAboutAssignment(target.email, id);
    return { assignedTo: userId };
  },

  async close(actor: Actor, id: string) {
    await requireVisible(actor, id);
    const row = await supportRepository.close(id);
    noReplyTimers.cancel(id);
    if (row) {
      await supportRepository.addMessage({
        conversationId: id,
        sender: 'system',
        body: 'This chat has ended.',
        allowClosed: true,
      });
      await publishSupportEvent({ type: 'message', conversationId: id, assignedTo: row.assignedTo, from: 'system' });
      await publishSupportEvent({ type: 'conversation', conversationId: id, assignedTo: row.assignedTo });
    }
    return { status: 'closed' as const };
  },

  // For an individual's erasure request.
  async remove(actor: Actor, id: string) {
    const row = await requireVisible(actor, id);
    await supportRepository.remove(id);
    noReplyTimers.cancel(id);
    await publishSupportEvent({ type: 'conversation', conversationId: id, assignedTo: row.assignedTo });
    return { deleted: true };
  },

  byId: supportRepository.byId,

  // Everyone who can answer chats, for the assign menu.
  async agents(): Promise<SupportAgentDto[]> {
    const rows = await supportRepository.staffCandidates();
    return rows
      .filter((u) => !isBanned(u) && hasPermission(parseRoles(u.role), { support: ['reply'] }))
      .map((u) => ({ id: u.id, name: u.name, online: isAgentOnline(u.id) }));
  },
};

// Same window as finished enquiries (Settings > Privacy).
export async function runSupportRetention({ dryRun = false, now = new Date() } = {}) {
  const privacy = parseGlobal('privacy', (await settingsRepository.get('privacy'))?.value);
  const { enquiryBefore } = retentionCutoffs(now, {
    enquiryRetentionMonths: privacy.enquiryRetentionMonths,
    spamRetentionDays: privacy.spamRetentionDays,
  });
  return dryRun ? supportRepository.countOlderThan(enquiryBefore) : supportRepository.purgeOlderThan(enquiryBefore);
}
