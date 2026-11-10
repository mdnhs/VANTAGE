import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './auth';

// A live chat between one website visitor and the support team. The visitor has no
// account: they are identified only by a random token held in an httpOnly cookie, and
// only its hash is stored. Deleting a staff user keeps the chat and clears the link.
export const supportConversations = pgTable(
  'support_conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenHash: text('token_hash').notNull(),
    status: varchar('status', { length: 16 }).notNull().default('open'),
    visitorName: varchar('visitor_name', { length: 120 }),
    visitorEmail: varchar('visitor_email', { length: 254 }),
    sourcePath: varchar('source_path', { length: 500 }),
    assignedTo: text('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
    lastMessagePreview: varchar('last_message_preview', { length: 160 }),
    lastVisitorMessageAt: timestamp('last_visitor_message_at', { withTimezone: true }),
    // Set when staff open the chat; a later visitor message makes it unread again.
    staffReadAt: timestamp('staff_read_at', { withTimezone: true }),
    // Set when the team is emailed about an unanswered chat; a staff reply clears it.
    staffAlertedAt: timestamp('staff_alerted_at', { withTimezone: true }),
    // The AI assistant answers while this is true. Any human reply, assignment or "take over" turns it off.
    aiEnabled: boolean('ai_enabled').notNull().default(true),
    // The AI could not help (or hit a limit) and a person is needed.
    needsHuman: boolean('needs_human').notNull().default(false),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('support_conversations_status_check', sql`${t.status} in ('open','closed')`),
    uniqueIndex('support_conversations_token_hash_idx').on(t.tokenHash),
    index('support_conversations_status_last_idx').on(t.status, t.lastMessageAt.desc()),
    index('support_conversations_assigned_idx').on(t.assignedTo, t.status),
  ],
);

export const supportMessages = pgTable(
  'support_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => supportConversations.id, { onDelete: 'cascade' }),
    sender: varchar('sender', { length: 16 }).notNull(),
    senderUserId: text('sender_user_id').references(() => users.id, { onDelete: 'set null' }),
    // Copied at send time so the transcript survives the staff user being renamed or deleted.
    senderName: varchar('sender_name', { length: 120 }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('support_messages_sender_check', sql`${t.sender} in ('visitor','staff','system','ai')`),
    index('support_messages_conversation_idx').on(t.conversationId, t.createdAt),
    index('support_messages_sender_user_idx').on(t.senderUserId),
  ],
);

export type SupportConversation = typeof supportConversations.$inferSelect;
export type SupportMessage = typeof supportMessages.$inferSelect;

// What the live chat AI knows: one row per piece of website content, written by the admin's
// "Sync" button. The AI reads these (ranked by the visitor's question) instead of searching the
// live tables on every message. `core` rows are always sent; the rest only when relevant.
export const supportKnowledge = pgTable(
  'support_knowledge',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    source: varchar('source', { length: 40 }).notNull(),
    sourceKey: varchar('source_key', { length: 200 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    body: text('body').notNull(),
    core: boolean('core').notNull().default(false),
    syncedAt: timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('support_knowledge_source_key_idx').on(t.source, t.sourceKey)],
);

// One row ('main'): progress of the latest sync, polled by the admin page's progress bar.
export const supportKnowledgeSync = pgTable(
  'support_knowledge_sync',
  {
    id: varchar('id', { length: 16 }).primaryKey(),
    status: varchar('status', { length: 16 }).notNull().default('idle'),
    step: varchar('step', { length: 120 }),
    total: integer('total').notNull().default(0),
    done: integer('done').notNull().default(0),
    chunks: integer('chunks').notNull().default(0),
    error: varchar('error', { length: 300 }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    startedBy: text('started_by'),
  },
  (t) => [check('support_knowledge_sync_status_check', sql`${t.status} in ('idle','running','done','failed')`)],
);
