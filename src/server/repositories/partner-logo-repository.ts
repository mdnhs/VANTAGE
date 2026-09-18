import { asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { partnerLogos } from '@/server/db/schema';
import type {
  CreatePartnerLogoInput,
  PartnerLogoListQuery,
  UpdatePartnerLogoInput,
} from '@/validations/partner-logo-schema';

export const partnerLogoRepository = {
  // Admin list: every row (enabled + disabled), ordered for the reorder UI, with a total
  // count for pagination. Small admin table — offset pagination is fine.
  async list({ page, limit }: Pick<PartnerLogoListQuery, 'page' | 'limit'>) {
    const offset = (page - 1) * limit;
    const [rows, [{ count }]] = await Promise.all([
      db.query.partnerLogos.findMany({
        orderBy: [asc(partnerLogos.displayOrder)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(partnerLogos),
    ]);
    return { rows, total: count };
  },

  // Public list: small dataset, no pagination — every enabled logo, in display order.
  async listEnabled() {
    return db.query.partnerLogos.findMany({
      where: eq(partnerLogos.isEnabled, true),
      orderBy: [asc(partnerLogos.displayOrder)],
    });
  },

  async byId(id: string) {
    return db.query.partnerLogos.findFirst({ where: eq(partnerLogos.id, id) });
  },

  async create(data: CreatePartnerLogoInput) {
    const [row] = await db.insert(partnerLogos).values(data).returning();
    return row;
  },

  async update(id: string, data: UpdatePartnerLogoInput) {
    const [row] = await db
      .update(partnerLogos)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(partnerLogos.id, id))
      .returning();
    return row;
  },

  async remove(id: string) {
    await db.delete(partnerLogos).where(eq(partnerLogos.id, id));
  },

  // One bulk UPDATE via a CASE WHEN expression — never a loop of per-row awaits. `ids[0]`
  // gets displayOrder 0, `ids[1]` gets 1, etc.
  async reorder(ids: string[]) {
    const caseChunks = sql.join(
      ids.map((id, index) => sql`WHEN ${id} THEN ${index}`),
      sql` `,
    );
    await db
      .update(partnerLogos)
      .set({
        displayOrder: sql`(CASE ${partnerLogos.id} ${caseChunks} END)::integer`,
        updatedAt: new Date(),
      })
      .where(inArray(partnerLogos.id, ids));
  },
};
