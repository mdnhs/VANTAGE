import { and, count, desc, eq, ilike, isNull, like, or, type SQL } from 'drizzle-orm';
import { db } from '@/server/db';
import { media } from '@/server/db/schema';
import type { MediaListQuery } from '@/validations/media-schema';

type NewMedia = typeof media.$inferInsert;

const live = isNull(media.deletedAt);

const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&');

export const mediaRepository = {
  async list({ page, limit, type, missingAlt, q }: MediaListQuery) {
    const filters: SQL[] = [live];
    if (q) {
      const pattern = `%${escapeLike(q)}%`;
      filters.push(or(ilike(media.filename, pattern), ilike(media.alt, pattern))!);
    }
    if (type === 'image') filters.push(like(media.mimeType, 'image/%'));
    if (type === 'video') filters.push(like(media.mimeType, 'video/%'));
    if (type === 'pdf') filters.push(eq(media.mimeType, 'application/pdf'));
    if (missingAlt) {
      filters.push(eq(media.alt, ''), eq(media.isDecorative, false), like(media.mimeType, 'image/%'));
    }
    const where = and(...filters);
    const [rows, [totalRow]] = await Promise.all([
      db
        .select()
        .from(media)
        .where(where)
        .orderBy(desc(media.createdAt), desc(media.id))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ n: count() }).from(media).where(where),
    ]);
    return { rows, total: totalRow?.n ?? 0 };
  },

  async byId(id: string) {
    const [row] = await db
      .select()
      .from(media)
      .where(and(eq(media.id, id), live))
      .limit(1);
    return row;
  },

  // Includes soft-deleted rows: `key` is unique across all of them.
  async keyExists(key: string) {
    const [row] = await db.select({ id: media.id }).from(media).where(eq(media.key, key)).limit(1);
    return Boolean(row);
  },

  async insert(data: NewMedia) {
    const [row] = await db.insert(media).values(data).returning();
    return row!;
  },

  async update(id: string, data: Partial<NewMedia>) {
    const [row] = await db
      .update(media)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(media.id, id), live))
      .returning();
    return row;
  },

  async softDelete(id: string) {
    const [row] = await db
      .update(media)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(media.id, id), live))
      .returning({ id: media.id });
    return Boolean(row);
  },
};
