import { asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { homepageCatalogs } from '@/server/db/schema';
import type {
  CreateHomepageCatalogInput,
  HomepageCatalogListQuery,
  UpdateHomepageCatalogInput,
} from '@/validations/homepage-catalog-schema';

export const homepageCatalogRepository = {
  async list({ page, limit }: Pick<HomepageCatalogListQuery, 'page' | 'limit'>) {
    const offset = (page - 1) * limit;
    const [rows, [{ count }]] = await Promise.all([
      db.query.homepageCatalogs.findMany({
        orderBy: [asc(homepageCatalogs.displayOrder)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(homepageCatalogs),
    ]);
    return { rows, total: count };
  },

  async listEnabled() {
    return db.query.homepageCatalogs.findMany({
      where: eq(homepageCatalogs.isEnabled, true),
      orderBy: [asc(homepageCatalogs.displayOrder)],
    });
  },

  async byId(id: string) {
    return db.query.homepageCatalogs.findFirst({ where: eq(homepageCatalogs.id, id) });
  },

  async create(data: CreateHomepageCatalogInput) {
    const [row] = await db.insert(homepageCatalogs).values(data).returning();
    return row;
  },

  async update(id: string, data: UpdateHomepageCatalogInput) {
    const [row] = await db
      .update(homepageCatalogs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(homepageCatalogs.id, id))
      .returning();
    return row;
  },

  async remove(id: string) {
    await db.delete(homepageCatalogs).where(eq(homepageCatalogs.id, id));
  },

  async reorder(ids: string[]) {
    const caseChunks = sql.join(
      ids.map((id, index) => sql`WHEN ${id} THEN ${index}`),
      sql` `,
    );
    await db
      .update(homepageCatalogs)
      .set({
        displayOrder: sql`(CASE ${homepageCatalogs.id} ${caseChunks} END)::integer`,
        updatedAt: new Date(),
      })
      .where(inArray(homepageCatalogs.id, ids));
  },
};
