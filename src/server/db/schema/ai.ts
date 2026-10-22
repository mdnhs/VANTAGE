import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './auth';

// Saved AI assistant conversations. Deleting a user deletes their conversations
// (GDPR); retention purges stale ones (`purgeStaleConversations`).
export const aiConversations = pgTable(
  'ai_conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    model: text('model').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('ai_conversations_user_updated_idx').on(t.userId, t.updatedAt.desc()),
    index('ai_conversations_updated_idx').on(t.updatedAt),
  ],
);

// `parts` holds AI SDK UI message parts, reduced before saving (V9-R13).
export const aiMessages = pgTable(
  'ai_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => aiConversations.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    parts: jsonb('parts').$type<unknown[]>().notNull(),
    tokensIn: integer('tokens_in'),
    tokensOut: integer('tokens_out'),
    // An assistant reply written while enquiry details could be in its tools'
    // output. Kept for its owner, but never sent back to the provider once
    // sharing is off.
    sharedEnquiryDetails: boolean('shared_enquiry_details').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('ai_messages_role_check', sql`${t.role} in ('user','assistant')`),
    index('ai_messages_conversation_idx').on(t.conversationId, t.createdAt),
  ],
);
