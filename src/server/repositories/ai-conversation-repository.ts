import 'server-only';

import { randomUUID } from 'node:crypto';

import { and, desc, eq, gte, lt, notExists, or, sql } from 'drizzle-orm';

import { textOnly, type AiPart, type AiUIMessage } from '@/lib/ai/messages';
import { db, type DbLike } from '@/server/db';
import { aiConversations, aiMessages } from '@/server/db/schema';
import { audit, type AuditActor } from '@/server/lib/audit';
import { ApiError } from '@/server/lib/errors';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The first message, no extra model call.
export function titleFrom(text: string) {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > 60 ? `${t.slice(0, 59).trimEnd()}…` : t;
}

export async function createConversation(userId: string, title: string, model: string) {
  const [row] = await db.insert(aiConversations).values({ userId, title, model }).returning({ id: aiConversations.id });
  return row!;
}

// Ownership is part of the lookup: someone else's id is simply not found.
export async function ownConversation(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(aiConversations)
    .where(and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)))
    .limit(1);
  if (!row) throw ApiError.notFound('Conversation not found');
  return row;
}

export async function appendMessage(
  conversationId: string,
  message: AiUIMessage,
  meta?: { tokensIn?: number; tokensOut?: number; sharedEnquiryDetails?: boolean },
) {
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(aiMessages).values({
      id: UUID.test(message.id) ? message.id : randomUUID(),
      conversationId,
      role: message.role,
      parts: message.parts,
      tokensIn: meta?.tokensIn ?? null,
      tokensOut: meta?.tokensOut ?? null,
      sharedEnquiryDetails: meta?.sharedEnquiryDetails ?? false,
      createdAt: now,
    });
    await tx.update(aiConversations).set({ updatedAt: now }).where(eq(aiConversations.id, conversationId));
  });
}

// Regenerate: the newest message goes if it is a reply, so the turn can run
// again from the person's last message. Callers check ownership first.
export async function dropLastReply(conversationId: string) {
  return db.transaction(async (tx) => {
    const [last] = await tx
      .select({ id: aiMessages.id, role: aiMessages.role })
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(desc(aiMessages.createdAt), desc(aiMessages.id))
      .limit(1)
      .for('update');
    if (last?.role !== 'assistant') return false;
    await tx.delete(aiMessages).where(and(eq(aiMessages.id, last.id), eq(aiMessages.conversationId, conversationId)));
    return true;
  });
}

// Edit: one of the person's own messages in this conversation, or not found.
// The id must belong to the conversation, so another conversation's message is never touched.
export async function ownUserMessage(conversationId: string, id: string) {
  const [row] = await db
    .select({ id: aiMessages.id, createdAt: aiMessages.createdAt })
    .from(aiMessages)
    .where(and(eq(aiMessages.id, id), eq(aiMessages.conversationId, conversationId), eq(aiMessages.role, 'user')))
    .limit(1);
  if (!row) throw ApiError.notFound('Message not found');
  return row;
}

// The edited message and everything after it go; the new text takes its
// place, in one transaction.
export async function replaceFrom(conversationId: string, from: { id: string; createdAt: Date }, message: AiUIMessage) {
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .delete(aiMessages)
      .where(and(eq(aiMessages.conversationId, conversationId), gte(aiMessages.createdAt, from.createdAt)));
    await tx.insert(aiMessages).values({
      id: UUID.test(message.id) ? message.id : randomUUID(),
      conversationId,
      role: message.role,
      parts: message.parts,
      createdAt: now,
    });
    await tx.update(aiConversations).set({ updatedAt: now }).where(eq(aiConversations.id, conversationId));
  });
}

// What the model sees of earlier turns is their text only. Replies written
// while enquiry details were shared stay out once sharing is off (or the
// person can no longer read enquiries).
export async function historyFor(
  conversationId: string,
  limit: number,
  options: { includeShared: boolean },
): Promise<AiUIMessage[]> {
  const rows = await db
    .select()
    .from(aiMessages)
    .where(
      and(
        eq(aiMessages.conversationId, conversationId),
        options.includeShared ? undefined : eq(aiMessages.sharedEnquiryDetails, false),
      ),
    )
    .orderBy(desc(aiMessages.createdAt), desc(aiMessages.id))
    .limit(limit);
  return rows
    .reverse()
    .map((r) => textOnly({ id: r.id, role: r.role as AiUIMessage['role'], parts: r.parts as AiPart[] }))
    .filter((m) => m.parts.length > 0);
}

export const RETENTION_DAYS = 90;
const DAY = 86_400_000;

export async function listConversations(userId: string) {
  const rows = await db
    .select({
      id: aiConversations.id,
      title: aiConversations.title,
      model: aiConversations.model,
      updatedAt: aiConversations.updatedAt,
    })
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(desc(aiConversations.updatedAt))
    .limit(50);
  return rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
}

export async function getConversation(userId: string, id: string) {
  const conv = await ownConversation(userId, id);
  const rows = await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, id))
    .orderBy(desc(aiMessages.createdAt), desc(aiMessages.id))
    .limit(200);
  return {
    id: conv.id,
    title: conv.title,
    model: conv.model,
    // The newest 200, oldest first.
    messages: rows
      .reverse()
      .map((r): AiUIMessage => ({ id: r.id, role: r.role as AiUIMessage['role'], parts: r.parts as AiPart[] })),
  };
}

export async function deleteConversation(actor: AuditActor, id: string) {
  await ownConversation(actor.userId, id);
  await db.transaction(async (tx) => {
    await tx.delete(aiConversations).where(eq(aiConversations.id, id));
    // The title is message text, so it stays out of the log.
    await audit(
      actor,
      {
        action: 'ai.conversation_delete',
        entityType: 'ai_conversation',
        entityId: id,
        summary: 'Deleted an AI assistant conversation',
      },
      tx,
    );
  });
  return { ok: true as const };
}

// Messages expire on their own age, so a conversation still in use keeps no
// text older than 90 days. Then conversations left empty, or idle for 90 days, go.
export async function purgeStaleConversations(now: Date, dbLike: DbLike = db) {
  const before = new Date(now.getTime() - RETENTION_DAYS * DAY);
  const messages = await dbLike
    .delete(aiMessages)
    .where(lt(aiMessages.createdAt, before))
    .returning({ id: aiMessages.id });
  const conversations = await dbLike
    .delete(aiConversations)
    .where(
      or(
        lt(aiConversations.updatedAt, before),
        // Empty ones go too, once past the hour in which a new conversation
        // is created and gets its first message.
        and(
          lt(aiConversations.createdAt, new Date(now.getTime() - 3_600_000)),
          notExists(
            dbLike
              .select({ one: sql`1` })
              .from(aiMessages)
              .where(eq(aiMessages.conversationId, aiConversations.id)),
          ),
        ),
      ),
    )
    .returning({ id: aiConversations.id });
  return { conversations: conversations.length, messages: messages.length };
}
