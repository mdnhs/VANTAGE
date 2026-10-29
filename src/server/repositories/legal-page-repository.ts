import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db, type DbLike } from '@/server/db';
import { legalPages, type NewLegalPage } from '@/server/db/schema';
import type { LegalPageListQuery } from '@/validations/legal-page-schema';

export const legalPageRepository = {
  // Admin list: drafts included, ordered for the reorder UI. Small table — offset pagination.
  async list({ page, limit }: Pick<LegalPageListQuery, 'page' | 'limit'>) {
    const [rows, [{ count }]] = await Promise.all([
      db.query.legalPages.findMany({ orderBy: [asc(legalPages.displayOrder)], limit, offset: (page - 1) * limit }),
      db.select({ count: sql<number>`count(*)::int` }).from(legalPages),
    ]);
    return { rows, total: count };
  },

  // Footer links: published only, title + slug, in display order.
  async listPublished() {
    return db
      .select({ title: legalPages.title, slug: legalPages.slug, publishedAt: legalPages.publishedAt })
      .from(legalPages)
      .where(eq(legalPages.status, 'published'))
      .orderBy(asc(legalPages.displayOrder));
  },

  async byId(id: string, dbLike: DbLike = db) {
    const [row] = await dbLike.select().from(legalPages).where(eq(legalPages.id, id)).limit(1);
    return row;
  },

  async publishedBySlug(slug: string) {
    const [row] = await db
      .select()
      .from(legalPages)
      .where(and(eq(legalPages.slug, slug), eq(legalPages.status, 'published')))
      .limit(1);
    return row;
  },

  async slugTaken(slug: string, exceptId: string | undefined, dbLike: DbLike) {
    const [row] = await dbLike.select({ id: legalPages.id }).from(legalPages).where(eq(legalPages.slug, slug)).limit(1);
    return Boolean(row && row.id !== exceptId);
  },

  // New pages go to the end of the footer.
  async insert(data: Omit<NewLegalPage, 'displayOrder'>, dbLike: DbLike = db) {
    const [row] = await dbLike
      .insert(legalPages)
      .values({
        ...data,
        displayOrder: sql`(select coalesce(max(${legalPages.displayOrder}) + 1, 0) from ${legalPages})`,
      })
      .returning({ id: legalPages.id });
    return row.id;
  },

  async patch(id: string, data: Partial<NewLegalPage>, dbLike: DbLike = db) {
    const [row] = await dbLike
      .update(legalPages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(legalPages.id, id))
      .returning({ id: legalPages.id });
    return row?.id;
  },

  async remove(id: string) {
    const [row] = await db.delete(legalPages).where(eq(legalPages.id, id)).returning({ slug: legalPages.slug });
    return row;
  },

  // One bulk UPDATE via CASE WHEN — `ids[0]` gets displayOrder 0, `ids[1]` gets 1, etc.
  // updatedAt is left alone: a reorder is not a content change.
  async reorder(ids: string[]) {
    const caseChunks = sql.join(
      ids.map((id, index) => sql`WHEN ${id} THEN ${index}`),
      sql` `,
    );
    await db
      .update(legalPages)
      .set({ displayOrder: sql`(CASE ${legalPages.id} ${caseChunks} END)::integer` })
      .where(inArray(legalPages.id, ids));
  },
};
