import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Snapshots of versioned entities (settings rollbacks, page publishes).
export const revisions = pgTable(
  'revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    version: integer('version').notNull(),
    snapshot: jsonb('snapshot').$type<unknown>().notNull(),
    note: text('note'),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('revisions_entity_idx').on(t.entityType, t.entityId, t.createdAt)],
);

export type Revision = typeof revisions.$inferSelect;
