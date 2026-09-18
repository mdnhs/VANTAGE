import { asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { services } from '@/server/db/schema';
import type { CreateServiceInput, ServiceListQuery, UpdateServiceInput } from '@/validations/service-schema';

export const serviceRepository = {
  // Admin list: every row (enabled + disabled), ordered for the reorder UI, with a total
  // count for pagination. Small admin table — offset pagination is fine (see
  // .claude/skills/backend-resource/references/cost-optimization.md exception for small
  // admin screens; cursor pagination is not required here).
  async list({ page, limit }: Pick<ServiceListQuery, 'page' | 'limit'>) {
    const offset = (page - 1) * limit;
    const [rows, [{ count }]] = await Promise.all([
      db.query.services.findMany({
        orderBy: [asc(services.displayOrder)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(services),
    ]);
    return { rows, total: count };
  },

  // Public list: small dataset, no pagination — every enabled service, in display order.
  async listPublished() {
    return db.query.services.findMany({
      where: eq(services.isEnabled, true),
      orderBy: [asc(services.displayOrder)],
    });
  },

  async byId(id: string) {
    return db.query.services.findFirst({ where: eq(services.id, id) });
  },

  async bySlug(slug: string) {
    return db.query.services.findFirst({ where: eq(services.slug, slug) });
  },

  async create(data: CreateServiceInput) {
    const [row] = await db.insert(services).values(data).returning();
    return row;
  },

  async update(id: string, data: UpdateServiceInput) {
    const [row] = await db
      .update(services)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return row;
  },

  async remove(id: string) {
    await db.delete(services).where(eq(services.id, id));
  },

  // One bulk UPDATE via a CASE WHEN expression — never a loop of per-row awaits. `ids[0]`
  // gets displayOrder 0, `ids[1]` gets 1, etc.
  async reorder(ids: string[]) {
    const caseChunks = sql.join(
      ids.map((id, index) => sql`WHEN ${id} THEN ${index}`),
      sql` `,
    );
    await db
      .update(services)
      .set({
        displayOrder: sql`(CASE ${services.id} ${caseChunks} END)::integer`,
        updatedAt: new Date(),
      })
      .where(inArray(services.id, ids));
  },
};
