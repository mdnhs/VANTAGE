import { asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { homepagePillars } from '@/server/db/schema';
import type {
  CreateHomepagePillarInput,
  HomepagePillarListQuery,
  UpdateHomepagePillarInput,
} from '@/validations/homepage-pillar-schema';

export const homepagePillarRepository = {
  // Admin list: every row (enabled + disabled), ordered for the reorder UI, with a total
  // count for pagination. Small admin table — offset pagination is fine.
  async list({ page, limit }: Pick<HomepagePillarListQuery, 'page' | 'limit'>) {
    const offset = (page - 1) * limit;
    const [rows, [{ count }]] = await Promise.all([
      db.query.homepagePillars.findMany({
        orderBy: [asc(homepagePillars.displayOrder)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(homepagePillars),
    ]);
    return { rows, total: count };
  },

  // Public list: small dataset, no pagination — every enabled pillar, in display order.
  async listEnabled() {
    return db.query.homepagePillars.findMany({
      where: eq(homepagePillars.isEnabled, true),
      orderBy: [asc(homepagePillars.displayOrder)],
    });
  },

  async byId(id: string) {
    return db.query.homepagePillars.findFirst({ where: eq(homepagePillars.id, id) });
  },

  async create(data: CreateHomepagePillarInput) {
    const [row] = await db.insert(homepagePillars).values(data).returning();
    return row;
  },

  async update(id: string, data: UpdateHomepagePillarInput) {
    const [row] = await db
      .update(homepagePillars)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(homepagePillars.id, id))
      .returning();
    return row;
  },

  async remove(id: string) {
    await db.delete(homepagePillars).where(eq(homepagePillars.id, id));
  },

  // One bulk UPDATE via a CASE WHEN expression — never a loop of per-row awaits. `ids[0]`
  // gets displayOrder 0, `ids[1]` gets 1, etc.
  async reorder(ids: string[]) {
    const caseChunks = sql.join(
      ids.map((id, index) => sql`WHEN ${id} THEN ${index}`),
      sql` `,
    );
    await db
      .update(homepagePillars)
      .set({
        displayOrder: sql`(CASE ${homepagePillars.id} ${caseChunks} END)::integer`,
        updatedAt: new Date(),
      })
      .where(inArray(homepagePillars.id, ids));
  },
};
