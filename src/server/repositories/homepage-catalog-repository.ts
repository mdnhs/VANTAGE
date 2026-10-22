import { asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { homepageCatalogs } from '@/server/db/schema';
import { contentImage } from '@/server/lib/media/content-images';
import type {
  CreateHomepageCatalogInput,
  HomepageCatalogListQuery,
  UpdateHomepageCatalogInput,
} from '@/validations/homepage-catalog-schema';

const withMedia = { iconMedia: true } as const;

function findOne(id: string) {
  return db.query.homepageCatalogs.findFirst({ where: eq(homepageCatalogs.id, id), with: withMedia });
}

type WithMedia = NonNullable<Awaited<ReturnType<typeof findOne>>>;

// Rows carry both the *MediaId column and the resolved PublicImage.
function present({ iconMedia, ...row }: WithMedia) {
  return { ...row, iconImage: contentImage(iconMedia, row.iconPublicId) };
}

export const homepageCatalogRepository = {
  async list({ page, limit }: Pick<HomepageCatalogListQuery, 'page' | 'limit'>) {
    const offset = (page - 1) * limit;
    const [rows, [{ count }]] = await Promise.all([
      db.query.homepageCatalogs.findMany({
        with: withMedia,
        orderBy: [asc(homepageCatalogs.displayOrder)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(homepageCatalogs),
    ]);
    return { rows: rows.map(present), total: count };
  },

  async listEnabled() {
    const rows = await db.query.homepageCatalogs.findMany({
      where: eq(homepageCatalogs.isEnabled, true),
      with: withMedia,
      orderBy: [asc(homepageCatalogs.displayOrder)],
    });
    return rows.map(present);
  },

  async byId(id: string) {
    const row = await findOne(id);
    return row ? present(row) : undefined;
  },

  async create(data: CreateHomepageCatalogInput) {
    const [row] = await db.insert(homepageCatalogs).values(data).returning({ id: homepageCatalogs.id });
    return homepageCatalogRepository.byId(row.id);
  },

  async update(id: string, data: UpdateHomepageCatalogInput) {
    const [row] = await db
      .update(homepageCatalogs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(homepageCatalogs.id, id))
      .returning({ id: homepageCatalogs.id });
    return row ? homepageCatalogRepository.byId(id) : undefined;
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
