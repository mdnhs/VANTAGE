import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db, type DbLike } from '@/server/db';
import { testimonials } from '@/server/db/schema';
import { contentImage } from '@/server/lib/media/content-images';
import type {
  CreateTestimonialInput,
  TestimonialListQuery,
  UpdateTestimonialInput,
} from '@/validations/testimonial-schema';

const withMedia = { avatarMedia: true } as const;

function findOne(id: string) {
  return db.query.testimonials.findFirst({ where: eq(testimonials.id, id), with: withMedia });
}

type WithMedia = NonNullable<Awaited<ReturnType<typeof findOne>>>;

// Rows carry both the *MediaId column and the resolved PublicImage.
function present({ avatarMedia, ...row }: WithMedia) {
  return { ...row, avatar: contentImage(avatarMedia, row.avatarPublicId) };
}

export const testimonialRepository = {
  // Admin list: every row (published + hidden), ordered for the reorder UI, with a total
  // count for pagination. Small admin table — offset pagination is fine, mirrors projects.
  async list({ page, limit }: Pick<TestimonialListQuery, 'page' | 'limit'>) {
    const offset = (page - 1) * limit;
    const [rows, [{ count }]] = await Promise.all([
      db.query.testimonials.findMany({
        with: withMedia,
        orderBy: [asc(testimonials.displayOrder)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(testimonials),
    ]);
    return { rows: rows.map(present), total: count };
  },

  // Public list: published only, in display order. Small dataset — a plain `limit` (default
  // 20) is enough, no cursor plumbing needed.
  async listPublished(params: { limit?: number } = {}) {
    const rows = await db.query.testimonials.findMany({
      where: eq(testimonials.status, 'published'),
      with: withMedia,
      orderBy: [asc(testimonials.displayOrder)],
      limit: params.limit ?? 20,
    });
    return rows.map(present);
  },

  // Homepage read: featured + published only, capped at 6.
  async listFeatured() {
    const rows = await db.query.testimonials.findMany({
      where: and(eq(testimonials.isFeatured, true), eq(testimonials.status, 'published')),
      with: withMedia,
      orderBy: [asc(testimonials.displayOrder)],
      limit: 6,
    });
    return rows.map(present);
  },

  async byId(id: string) {
    const row = await findOne(id);
    return row ? present(row) : undefined;
  },

  // Write-only halves of create/update: the caller's transaction re-checks media first.
  async insert(data: CreateTestimonialInput, dbLike: DbLike = db) {
    const [row] = await dbLike.insert(testimonials).values(data).returning({ id: testimonials.id });
    return row.id;
  },

  async patch(id: string, data: UpdateTestimonialInput, dbLike: DbLike = db) {
    const [row] = await dbLike
      .update(testimonials)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(testimonials.id, id))
      .returning({ id: testimonials.id });
    return row?.id;
  },

  async create(data: CreateTestimonialInput) {
    return testimonialRepository.byId(await testimonialRepository.insert(data));
  },

  async update(id: string, data: UpdateTestimonialInput) {
    return (await testimonialRepository.patch(id, data)) ? testimonialRepository.byId(id) : undefined;
  },

  async remove(id: string) {
    await db.delete(testimonials).where(eq(testimonials.id, id));
  },

  async updateStatus(id: string, status: 'published' | 'hidden') {
    const [row] = await db
      .update(testimonials)
      .set({ status, updatedAt: new Date() })
      .where(eq(testimonials.id, id))
      .returning({ id: testimonials.id });
    return row ? testimonialRepository.byId(id) : undefined;
  },

  // One bulk UPDATE via a CASE WHEN expression — never a loop of per-row awaits.
  async reorder(ids: string[]) {
    const caseChunks = sql.join(
      ids.map((id, index) => sql`WHEN ${id} THEN ${index}`),
      sql` `,
    );
    await db
      .update(testimonials)
      .set({
        displayOrder: sql`(CASE ${testimonials.id} ${caseChunks} END)::integer`,
        updatedAt: new Date(),
      })
      .where(inArray(testimonials.id, ids));
  },
};
