import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth';

// Who changed what, when. Never store enquiry content. Mirrors MK audit_logs;
// actor ids are text (VANTAGE users.id is text).
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorEmail: text('actor_email'),
    // The real user behind a View-as session; actorId is who they viewed as.
    impersonatedBy: text('impersonated_by').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    summary: text('summary').notNull(),
    diff: jsonb('diff').$type<Record<string, { from: unknown; to: unknown }>>(),
    ipHash: text('ip_hash'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_logs_created_at_idx').on(table.createdAt.desc()),
    index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    index('audit_logs_action_created_idx').on(table.action, table.createdAt.desc()),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
