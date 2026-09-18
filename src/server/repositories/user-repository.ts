import { desc, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';

export const userRepository = {
  list() {
    return db
      .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt })
      .from(users)
      .orderBy(desc(users.createdAt));
  },

  byEmail(email: string) {
    return db.query.users.findFirst({ where: eq(users.email, email) });
  },
};
