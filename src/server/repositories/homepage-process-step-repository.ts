import { asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { homepageProcessSteps } from '@/server/db/schema';
import type {
  CreateHomepageProcessStepInput,
  HomepageProcessStepListQuery,
  UpdateHomepageProcessStepInput,
} from '@/validations/homepage-process-step-schema';

export const homepageProcessStepRepository = {
  // Admin list: every row (enabled + disabled), ordered for the reorder UI, with a total
  // count for pagination. Small admin table — offset pagination is fine.
  async list({ page, limit }: Pick<HomepageProcessStepListQuery, 'page' | 'limit'>) {
    const offset = (page - 1) * limit;
    const [rows, [{ count }]] = await Promise.all([
      db.query.homepageProcessSteps.findMany({
        orderBy: [asc(homepageProcessSteps.displayOrder)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(homepageProcessSteps),
    ]);
    return { rows, total: count };
  },

  // Public list: small dataset, no pagination — every enabled step, in display order.
  async listEnabled() {
    return db.query.homepageProcessSteps.findMany({
      where: eq(homepageProcessSteps.isEnabled, true),
      orderBy: [asc(homepageProcessSteps.displayOrder)],
    });
  },

  async byId(id: string) {
    return db.query.homepageProcessSteps.findFirst({ where: eq(homepageProcessSteps.id, id) });
  },

  async create(data: CreateHomepageProcessStepInput) {
    const [row] = await db.insert(homepageProcessSteps).values(data).returning();
    return row;
  },

  async update(id: string, data: UpdateHomepageProcessStepInput) {
    const [row] = await db
      .update(homepageProcessSteps)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(homepageProcessSteps.id, id))
      .returning();
    return row;
  },

  async remove(id: string) {
    await db.delete(homepageProcessSteps).where(eq(homepageProcessSteps.id, id));
  },

  // One bulk UPDATE via a CASE WHEN expression — never a loop of per-row awaits. `ids[0]`
  // gets displayOrder 0, `ids[1]` gets 1, etc.
  async reorder(ids: string[]) {
    const caseChunks = sql.join(
      ids.map((id, index) => sql`WHEN ${id} THEN ${index}`),
      sql` `,
    );
    await db
      .update(homepageProcessSteps)
      .set({
        displayOrder: sql`(CASE ${homepageProcessSteps.id} ${caseChunks} END)::integer`,
        updatedAt: new Date(),
      })
      .where(inArray(homepageProcessSteps.id, ids));
  },
};
