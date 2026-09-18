import { eq, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { adminUsers, type NewAdminUser } from '@/server/db/schema';

export const adminUserRepository = {
  byEmail(email: string) {
    return db.query.adminUsers.findFirst({ where: eq(adminUsers.email, email) });
  },

  async touchLastLogin(id: string) {
    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, id));
  },

  // Seed-script only — never exposed over the API this phase.
  async create(data: NewAdminUser) {
    const [row] = await db.insert(adminUsers).values(data).returning();
    return row;
  },

  // Small, admin-only table — no pagination needed.
  list() {
    return db.query.adminUsers.findMany({ orderBy: [adminUsers.createdAt] });
  },

  byId(id: string) {
    return db.query.adminUsers.findFirst({ where: eq(adminUsers.id, id) });
  },

  async update(id: string, data: Partial<Pick<NewAdminUser, 'name' | 'permissionsBitfield' | 'isActive'>>) {
    const [row] = await db
      .update(adminUsers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
      .returning();
    return row;
  },

  async updatePassword(id: string, passwordHash: string) {
    await db.update(adminUsers).set({ passwordHash, updatedAt: new Date() }).where(eq(adminUsers.id, id));
  },

  async remove(id: string) {
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
  },

  // Used by the service's last-active-admin guard before a deactivate/delete.
  async countActive() {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminUsers)
      .where(eq(adminUsers.isActive, true));
    return count;
  },
};
