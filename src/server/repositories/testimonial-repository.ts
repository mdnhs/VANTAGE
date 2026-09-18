import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { testimonials } from '@/server/db/schema';
import type {
  CreateTestimonialInput,
  TestimonialListQuery,
  UpdateTestimonialInput,
} from '@/validations/testimonial-schema';

export const testimonialRepository = {
  // Admin list: every row (published + hidden), ordered for the reorder UI, with a total
  // count for pagination. Small admin table — offset pagination is fine, mirrors projects.
  async list({ page, limit }: Pick<TestimonialListQuery, 'page' | 'limit'>) {
    const offset = (page - 1) * limit;
    const [rows, [{ count }]] = await Promise.all([
      db.query.testimonials.findMany({
        orderBy: [asc(testimonials.displayOrder)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(testimonials),
    ]);
    return { rows, total: count };
  },

  // Public list: published only, in display order. Small dataset — a plain `limit` (default
  // 20) is enough, no cursor plumbing needed.
  async listPublished(params: { limit?: number } = {}) {
    return db.query.testimonials.findMany({
      where: eq(testimonials.status, 'published'),
      orderBy: [asc(testimonials.displayOrder)],
      limit: params.limit ?? 20,
    });
  },

  // Homepage read: featured + published only, capped at 6.
  async listFeatured() {
    return db.query.testimonials.findMany({
      where: and(eq(testimonials.isFeatured, true), eq(testimonials.status, 'published')),
      orderBy: [asc(testimonials.displayOrder)],
      limit: 6,
    });
  },

  async byId(id: string) {
    return db.query.testimonials.findFirst({
      where: eq(testimonials.id, id),
    });
  },

  async create(data: CreateTestimonialInput) {
    const [row] = await db.insert(testimonials).values(data).returning();
    return row;
  },

  async update(id: string, data: UpdateTestimonialInput) {
    const [row] = await db
      .update(testimonials)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(testimonials.id, id))
      .returning();
    return row;
  },

  async remove(id: string) {
    await db.delete(testimonials).where(eq(testimonials.id, id));
  },

  async updateStatus(id: string, status: 'published' | 'hidden') {
    const [row] = await db
      .update(testimonials)
      .set({ status, updatedAt: new Date() })
      .where(eq(testimonials.id, id))
      .returning();
    return row;
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
        displayOrder: sql`(CASE ${testimonials.id} ${caseChunks} END)`,
        updatedAt: new Date(),
      })
      .where(inArray(testimonials.id, ids));
  },
};
