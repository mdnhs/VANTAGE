import 'server-only';

import { and, count, desc, eq, ilike, inArray, isNull, like, notExists, or, sql, type SQL } from 'drizzle-orm';
import { db, type DbLike } from '@/server/db';
import { enquiryPhotos, media } from '@/server/db/schema';
import type { MediaListQuery } from '@/validations/media-schema';

type NewMedia = typeof media.$inferInsert;

const live = isNull(media.deletedAt);
// The library (admin routes) only ever sees library-scope rows; enquiry photos are reached
// through their lead (enquiry_photos join) and the migration (legacy_source), never by id here.
const inLibrary = and(live, eq(media.scope, 'library'));

const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&');

export const mediaRepository = {
  async list({ page, limit, type, missingAlt, q, ids }: MediaListQuery) {
    // Enquiry photos belong to a lead, never to the library grid.
    const filters: SQL[] = [live, eq(media.scope, 'library')];
    if (ids) filters.push(ids.length > 0 ? inArray(media.id, ids) : sql`false`);
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

  async byId(id: string, dbLike: DbLike = db) {
    const [row] = await dbLike
      .select()
      .from(media)
      .where(and(eq(media.id, id), inLibrary))
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

  // Any row carrying this migration key, soft-deleted or not.
  async byLegacySource(legacySource: string) {
    const [row] = await db.select().from(media).where(eq(media.legacySource, legacySource)).limit(1);
    return row;
  },

  // Enquiry-scope rows no lead links to any more; returns their storage keys.
  async deleteUnlinkedEnquiry(ids: string[]) {
    if (ids.length === 0) return [];
    const rows = await db
      .delete(media)
      .where(
        and(
          inArray(media.id, ids),
          eq(media.scope, 'enquiry'),
          notExists(
            db
              .select({ one: sql`1` })
              .from(enquiryPhotos)
              .where(eq(enquiryPhotos.mediaId, media.id)),
          ),
        ),
      )
      .returning({ key: media.key });
    return rows.map((r) => r.key);
  },

  async update(id: string, data: Partial<NewMedia>) {
    const [row] = await db
      .update(media)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(media.id, id), inLibrary))
      .returning();
    return row;
  },

  async softDelete(id: string, dbLike: DbLike = db) {
    const [row] = await dbLike
      .update(media)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(media.id, id), inLibrary))
      .returning({ id: media.id });
    return Boolean(row);
  },
};
