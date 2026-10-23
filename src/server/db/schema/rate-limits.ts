import { bigint, integer, pgTable, text } from 'drizzle-orm/pg-core';

// Better Auth database rate-limit storage (rateLimit.storage = 'database').
export const rateLimits = pgTable('rate_limits', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});
