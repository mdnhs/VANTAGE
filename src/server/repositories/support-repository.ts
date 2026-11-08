import 'server-only';

import { and, asc, count, desc, eq, isNotNull, isNull, lt, ne, sql, type SQL } from 'drizzle-orm';

import type { SupportSender } from '@/lib/support/types';
import { db } from '@/server/db';
import { supportConversations as conversations, supportMessages as messages, users } from '@/server/db/schema';
import type { SupportListQuery } from '@/validations/support-schema';

// A chat shows the newest messages only; the oldest drop off the view, never the table.
const MESSAGE_WINDOW = 300;
const PREVIEW_LENGTH = 160;

const unread = sql<boolean>`${conversations.lastVisitorMessageAt} is not null and (${conversations.staffReadAt} is null or ${conversations.lastVisitorMessageAt} > ${conversations.staffReadAt})`;

const listColumns = {
  id: conversations.id,
  status: conversations.status,
  visitorName: conversations.visitorName,
  visitorEmail: conversations.visitorEmail,
  assignedTo: conversations.assignedTo,
  assigneeName: users.name,
  preview: conversations.lastMessagePreview,
  lastMessageAt: conversations.lastMessageAt,
  unread,
  sourcePath: conversations.sourcePath,
  createdAt: conversations.createdAt,
};

export type NewSupportMessage = {
  conversationId: string;
  sender: SupportSender;
  body: string;
  senderUserId?: string | null;
  senderName?: string | null;
  allowClosed?: boolean;
};

// `onlyAssignedTo` limits a support agent to their own chats.
const scope = (onlyAssignedTo: string | null): SQL | undefined =>
  onlyAssignedTo ? eq(conversations.assignedTo, onlyAssignedTo) : undefined;

export const supportRepository = {
  async create(input: { tokenHash: string; body: string; visitorName?: string | null; sourcePath?: string | null }) {
    return db.transaction(async (tx) => {
      const now = new Date();
      const [row] = await tx
        .insert(conversations)
        .values({
          tokenHash: input.tokenHash,
          visitorName: input.visitorName || null,
          sourcePath: input.sourcePath || null,
          lastMessageAt: now,
          lastVisitorMessageAt: now,
          lastMessagePreview: input.body.slice(0, PREVIEW_LENGTH),
        })
        .returning();
      await tx.insert(messages).values({ conversationId: row!.id, sender: 'visitor', body: input.body });
      return row!;
    });
  },

  byTokenHash: (tokenHash: string) =>
    db.query.supportConversations.findFirst({ where: eq(conversations.tokenHash, tokenHash) }),

  byId: (id: string) => db.query.supportConversations.findFirst({ where: eq(conversations.id, id) }),

  // Newest window, returned oldest first.
  async messages(conversationId: string) {
    const rows = await db
      .select({
        id: messages.id,
        sender: messages.sender,
        senderName: messages.senderName,
        body: messages.body,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(MESSAGE_WINDOW);
    return rows.reverse();
  },

  // Writes the message and moves the chat's "last message" fields in one step. The update comes
  // first and locks the row, so a message can never land on a chat that was just closed: it
  // returns null instead. Only the closing notice itself may be added to a closed chat.
  async addMessage(input: NewSupportMessage) {
    return db.transaction(async (t) => {
      const now = new Date();
      const [chat] = await t
        .update(conversations)
        .set({
          lastMessageAt: now,
          lastMessagePreview: input.body.slice(0, PREVIEW_LENGTH),
          ...(input.sender === 'visitor' ? { lastVisitorMessageAt: now } : {}),
          ...(input.sender === 'staff' ? { staffAlertedAt: null } : {}),
        })
        .where(
          and(
            eq(conversations.id, input.conversationId),
            input.allowClosed ? undefined : eq(conversations.status, 'open'),
          ),
        )
        .returning({ id: conversations.id });
      if (!chat) return null;
      const [row] = await t
        .insert(messages)
        .values({
          conversationId: input.conversationId,
          sender: input.sender,
          body: input.body,
          senderUserId: input.senderUserId ?? null,
          senderName: input.senderName ?? null,
        })
        .returning();
      return row!;
    });
  },

  async setVisitorContact(id: string, input: { email: string; name?: string }) {
    await db
      .update(conversations)
      .set({ visitorEmail: input.email, ...(input.name ? { visitorName: input.name } : {}) })
      .where(eq(conversations.id, id));
  },

  // The row lock queues simultaneous assigns, and the notice is stamped after it is taken, so the
  // last notice always names whoever ends up holding the chat. A new holder starts with it unread.
  async assign(id: string, userId: string | null, notice: string | null) {
    return db.transaction(async (t) => {
      const [chat] = await t
        .select({ status: conversations.status, assignedTo: conversations.assignedTo })
        .from(conversations)
        .where(eq(conversations.id, id))
        .for('update');
      if (!chat || chat.status !== 'open') return { outcome: 'closed', previous: null } as const;
      if (chat.assignedTo === userId) return { outcome: 'unchanged', previous: null } as const;
      const now = new Date();
      await t
        .update(conversations)
        .set({
          assignedTo: userId,
          assignedAt: userId ? now : null,
          ...(userId ? { staffReadAt: null } : {}),
          ...(notice ? { lastMessageAt: now, lastMessagePreview: notice.slice(0, PREVIEW_LENGTH) } : {}),
        })
        .where(eq(conversations.id, id));
      if (notice) {
        await t
          .insert(messages)
          .values({ conversationId: id, sender: 'system', body: notice, createdAt: sql`clock_timestamp()` });
      }
      return { outcome: 'changed', previous: chat.assignedTo } as const;
    });
  },

  // Only the caller that actually closed it gets a row back, so a double click posts one notice.
  async close(id: string) {
    const [row] = await db
      .update(conversations)
      .set({ status: 'closed', closedAt: new Date() })
      .where(and(eq(conversations.id, id), eq(conversations.status, 'open')))
      .returning();
    return row ?? null;
  },

  // Only the caller that actually sets the mark gets a row back, so a chat alerts once per wait.
  async claimNoReplyAlert(id: string) {
    const [row] = await db
      .update(conversations)
      .set({ staffAlertedAt: new Date() })
      .where(and(eq(conversations.id, id), eq(conversations.status, 'open'), isNull(conversations.staffAlertedAt)))
      .returning();
    return row ?? null;
  },

  async markRead(id: string) {
    await db.update(conversations).set({ staffReadAt: new Date() }).where(eq(conversations.id, id));
  },

  // One more row than asked for tells the UI whether there is a next page, without a COUNT.
  async list(query: SupportListQuery, onlyAssignedTo: string | null) {
    const rows = await db
      .select(listColumns)
      .from(conversations)
      .leftJoin(users, eq(users.id, conversations.assignedTo))
      .where(and(eq(conversations.status, query.status), scope(onlyAssignedTo)))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(query.limit + 1);
    return { rows: rows.slice(0, query.limit), hasMore: rows.length > query.limit };
  },

  async detail(id: string) {
    const [row] = await db
      .select(listColumns)
      .from(conversations)
      .leftJoin(users, eq(users.id, conversations.assignedTo))
      .where(eq(conversations.id, id))
      .limit(1);
    return row ?? null;
  },

  async unreadCount(onlyAssignedTo: string | null) {
    const [row] = await db
      .select({ n: count() })
      .from(conversations)
      .where(and(eq(conversations.status, 'open'), unread, scope(onlyAssignedTo)));
    return row?.n ?? 0;
  },

  staffCandidates: () =>
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        banned: users.banned,
        banExpires: users.banExpires,
      })
      .from(users)
      .where(and(isNotNull(users.role), ne(users.role, 'user')))
      .orderBy(asc(users.name)),

  staffById: (id: string) => db.query.users.findFirst({ where: eq(users.id, id) }),

  async remove(id: string) {
    await db.delete(conversations).where(eq(conversations.id, id));
  },

  // Cascades to the messages. Measured from the last message, so an active chat never expires.
  async purgeOlderThan(before: Date) {
    return (
      await db.delete(conversations).where(lt(conversations.lastMessageAt, before)).returning({ id: conversations.id })
    ).length;
  },

  async countOlderThan(before: Date) {
    const [row] = await db.select({ n: count() }).from(conversations).where(lt(conversations.lastMessageAt, before));
    return row?.n ?? 0;
  },
};

export type SupportListRow = Awaited<ReturnType<typeof supportRepository.list>>['rows'][number];
