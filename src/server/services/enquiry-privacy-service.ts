import 'server-only';

import { and, asc, inArray, notExists, eq, sql } from 'drizzle-orm';

import { db } from '@/server/db';
import {
  aiConversations,
  aiMessages,
  contactMessages,
  enquiryPhotos,
  quoteRequests,
  supportConversations,
  supportMessages,
} from '@/server/db/schema';
import { audit } from '@/server/lib/audit';
import type { Actor } from '@/server/lib/auth/actor';
import { derivedHmac } from '@/server/lib/crypto';
import { hasBillingData, noBillingData } from '@/server/lib/enquiries/billing';
import { attachPhotos } from '@/server/lib/media/enquiry-photos';
import { hardDeleteEnquiryMedia } from '@/server/services/media-library-service';

export type PrivacyKept = { id: string; reason: 'billing' };
export type ErasureResult = {
  deleted: { quotes: number; contacts: number; aiMessages: number; supportChats: number };
  kept: PrivacyKept[];
};

const normalise = (email: string) => email.trim().toLowerCase();

// Saved assistant replies that quote the address (substring, case-insensitive; no pattern, so nothing to escape).
const mentions = (email: string) => sql`position(${normalise(email)} in lower(${aiMessages.parts}::text)) > 0`;
// The audit log identifies the person by a keyed hash, never by the address.
const personId = (email: string) => derivedHmac('privacy-email', normalise(email));

const quoteMatch = (email: string) => sql`lower(trim(${quoteRequests.email})) = ${normalise(email)}`;
const contactMatch = (email: string) => sql`lower(trim(${contactMessages.email})) = ${normalise(email)}`;
// A live chat given under the address, or one where the address was typed into a message.
const chatMatch = (email: string) =>
  sql`(lower(trim(${supportConversations.visitorEmail})) = ${normalise(email)} or exists (
    select 1 from ${supportMessages}
    where ${supportMessages.conversationId} = ${supportConversations.id}
      and position(${normalise(email)} in lower(${supportMessages.body})) > 0
  ))`;

export async function exportPerson(actor: Actor, email: string) {
  const quotes = await attachPhotos('quoteRequestId', await db.select().from(quoteRequests).where(quoteMatch(email)));
  const contacts = await attachPhotos(
    'contactMessageId',
    await db.select().from(contactMessages).where(contactMatch(email)),
  );
  const ai = await db
    .select({ role: aiMessages.role, parts: aiMessages.parts, createdAt: aiMessages.createdAt })
    .from(aiMessages)
    .where(mentions(email))
    .orderBy(asc(aiMessages.createdAt));
  // Named columns: the visitor's secret token hash never leaves the database.
  const chats = await db
    .select({
      id: supportConversations.id,
      status: supportConversations.status,
      visitorName: supportConversations.visitorName,
      visitorEmail: supportConversations.visitorEmail,
      sourcePath: supportConversations.sourcePath,
      createdAt: supportConversations.createdAt,
      closedAt: supportConversations.closedAt,
    })
    .from(supportConversations)
    .where(chatMatch(email));
  const chatMessages =
    chats.length === 0
      ? []
      : await db
          .select({
            conversationId: supportMessages.conversationId,
            sender: supportMessages.sender,
            senderName: supportMessages.senderName,
            body: supportMessages.body,
            createdAt: supportMessages.createdAt,
          })
          .from(supportMessages)
          .where(
            inArray(
              supportMessages.conversationId,
              chats.map((c) => c.id),
            ),
          )
          .orderBy(asc(supportMessages.createdAt));
  const supportChats = chats.map((chat) => ({
    ...chat,
    messages: chatMessages
      .filter((m) => m.conversationId === chat.id)
      .map(({ conversationId: _conversationId, ...message }) => message),
  }));
  await audit(actor, {
    action: 'privacy.export',
    entityType: 'person',
    entityId: personId(email),
    summary: `Privacy export: ${quotes.length} quotes, ${contacts.length} contact messages, ${ai.length} AI messages and ${chats.length} live chats`,
  });
  return {
    email: normalise(email),
    exportedAt: new Date().toISOString(),
    quotes,
    contacts,
    aiMessages: ai,
    supportChats,
  };
}

// Deletes every contact message and every quote without invoice or payment data (and their enquiry
// photos). Quotes with billing data stay for the 6-year accounting rule and are reported.
export async function erasePerson(actor: Actor, email: string): Promise<ErasureResult> {
  const mediaIds: string[] = [];
  const result = await db.transaction(async (tx) => {
    const quoteRows = await tx
      .select({
        id: quoteRequests.id,
        invoiceNumber: quoteRequests.invoiceNumber,
        paymentStatus: quoteRequests.paymentStatus,
        paidAmount: quoteRequests.paidAmount,
        paymentMethod: quoteRequests.paymentMethod,
      })
      .from(quoteRequests)
      .where(quoteMatch(email))
      .for('update');
    const kept: PrivacyKept[] = quoteRows.filter(hasBillingData).map((r) => ({ id: r.id, reason: 'billing' }));
    const keptIds = new Set(kept.map((k) => k.id));
    const quoteIds = quoteRows.filter((r) => !keptIds.has(r.id)).map((r) => r.id);
    const contactIds = (
      await tx.select({ id: contactMessages.id }).from(contactMessages).where(contactMatch(email)).for('update')
    ).map((r) => r.id);

    // Note the linked media first: the links cascade away with their rows.
    const links = async (
      column: typeof enquiryPhotos.quoteRequestId | typeof enquiryPhotos.contactMessageId,
      ids: string[],
    ) =>
      ids.length === 0
        ? []
        : await tx.select({ mediaId: enquiryPhotos.mediaId }).from(enquiryPhotos).where(inArray(column, ids));
    for (const l of await links(enquiryPhotos.quoteRequestId, quoteIds)) mediaIds.push(l.mediaId);
    for (const l of await links(enquiryPhotos.contactMessageId, contactIds)) mediaIds.push(l.mediaId);

    // The billing predicate stays in the delete itself, so a row paid since the read still survives.
    const deletedQuotes =
      quoteIds.length === 0
        ? []
        : await tx
            .delete(quoteRequests)
            .where(and(inArray(quoteRequests.id, quoteIds), noBillingData()))
            .returning({ id: quoteRequests.id });
    const deletedContacts =
      contactIds.length === 0
        ? []
        : await tx
            .delete(contactMessages)
            .where(inArray(contactMessages.id, contactIds))
            .returning({ id: contactMessages.id });
    const gone = new Set(deletedQuotes.map((r) => r.id));
    for (const id of quoteIds) if (!gone.has(id)) kept.push({ id, reason: 'billing' });

    // Opted-in enquiry quotes in saved assistant replies. Conversations left empty go too.
    const goneAi = await tx
      .delete(aiMessages)
      .where(mentions(email))
      .returning({ conversationId: aiMessages.conversationId });
    const touched = [...new Set(goneAi.map((r) => r.conversationId))];
    if (touched.length > 0) {
      await tx.delete(aiConversations).where(
        and(
          inArray(aiConversations.id, touched),
          notExists(
            tx
              .select({ one: sql`1` })
              .from(aiMessages)
              .where(eq(aiMessages.conversationId, aiConversations.id)),
          ),
        ),
      );
    }

    // Messages cascade away with their chat.
    const goneChats = await tx
      .delete(supportConversations)
      .where(chatMatch(email))
      .returning({ id: supportConversations.id });

    const deleted = {
      quotes: deletedQuotes.length,
      contacts: deletedContacts.length,
      aiMessages: goneAi.length,
      supportChats: goneChats.length,
    };
    await audit(
      actor,
      {
        action: 'privacy.erase',
        entityType: 'person',
        entityId: personId(email),
        summary: `Privacy erase: ${deleted.quotes} quotes and ${deleted.contacts} contact messages and ${deleted.aiMessages} AI messages and ${deleted.supportChats} live chats deleted, ${kept.length} quotes kept (invoice or payment records)`,
      },
      tx,
    );
    return { deleted, kept };
  });

  // After the commit, best effort: a failure leaves unlinked files the retention sweep removes.
  if (mediaIds.length > 0) {
    try {
      await hardDeleteEnquiryMedia(mediaIds);
    } catch {
      console.error('[privacy] photo deletion failed');
    }
  }
  return result;
}
