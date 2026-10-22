import { afterEach, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { auditLogs, quoteRequests, users } from '@/server/db/schema';

const USER_ID = 'user_schema_test';

async function insertUser() {
  const [row] = await db
    .insert(users)
    .values({ id: USER_ID, name: 'Schema Test', email: 'schema-test@example.com' })
    .returning();
  return row!;
}

describe('auth schema (admin, audit, quote assignment)', () => {
  afterEach(async () => {
    await db.execute(sql`truncate table audit_logs, quote_requests`);
    await db.delete(users).where(eq(users.id, USER_ID));
  });

  it('defaults users.role to user and flags to off', async () => {
    const user = await insertUser();
    expect(user.role).toBe('user');
    expect(user.banned).toBe(false);
    expect(user.twoFactorEnabled).toBe(false);
    expect(user.notificationsSeenAt).toBeNull();
  });

  it('sets audit_logs.actor_id null when the user is deleted', async () => {
    await insertUser();
    const [log] = await db
      .insert(auditLogs)
      .values({ actorId: USER_ID, action: 'x.y', entityType: 'x', summary: 's' })
      .returning();
    expect(log!.actorId).toBe(USER_ID);
    await db.delete(users).where(eq(users.id, USER_ID));
    const [after] = await db.select().from(auditLogs).where(eq(auditLogs.id, log!.id));
    expect(after!.actorId).toBeNull();
  });

  it('sets quote_requests.assigned_user_id null when the user is deleted', async () => {
    await insertUser();
    const [q] = await db
      .insert(quoteRequests)
      .values({ name: 'N', email: 'n@example.com', phone: '1', assignedUserId: USER_ID })
      .returning();
    expect(q!.assignedUserId).toBe(USER_ID);
    await db.delete(users).where(eq(users.id, USER_ID));
    const [after] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, q!.id));
    expect(after!.assignedUserId).toBeNull();
  });
});
