import { boolean, index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull().default('admin'),
    // Compact compressed-permissions string (see src/lib/permission/utils.ts).
    permissionsBitfield: varchar('permissions_bitfield', { length: 500 }).notNull().default(''),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('admin_users_email_idx').on(table.email)],
);

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
