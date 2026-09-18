import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { contactMessages } from '@/server/db/schema';
import type {
  CreateContactMessageInput,
  ContactMessageListQuery,
  UpdateContactMessageInput,
} from '@/validations/contact-message-schema';
import type { ContactMessageStats } from '@/features/contact-messages/types';

export const contactMessageRepository = {
  async list({ page, limit, status, search }: ContactMessageListQuery) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(eq(contactMessages.status, status));
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(contactMessages.firstName, q),
          ilike(contactMessages.lastName, q),
          ilike(contactMessages.email, q),
          ilike(contactMessages.phone, q),
          ilike(contactMessages.service, q),
          ilike(contactMessages.message, q),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ count }]] = await Promise.all([
      db.query.contactMessages.findMany({
        where: whereClause,
        orderBy: [desc(contactMessages.createdAt)],
        limit,
        offset,
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(contactMessages)
        .where(whereClause),
    ]);

    return { rows, total: count };
  },

  async stats(): Promise<ContactMessageStats> {
    const rows = await db
      .select({
        status: contactMessages.status,
        count: sql<number>`count(*)::int`,
      })
      .from(contactMessages)
      .groupBy(contactMessages.status);

    const counts: ContactMessageStats = {
      all: 0,
      new: 0,
      read: 0,
      replied: 0,
      archived: 0,
    };

    for (const r of rows) {
      if (r.status in counts) {
        counts[r.status as keyof ContactMessageStats] = r.count;
      }
      counts.all += r.count;
    }

    return counts;
  },

  async byId(id: string) {
    return db.query.contactMessages.findFirst({ where: eq(contactMessages.id, id) });
  },

  async create(data: CreateContactMessageInput) {
    const [row] = await db
      .insert(contactMessages)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        service: data.service || null,
        message: data.message,
        photoUrls: data.photoUrls || [],
        source: data.source || 'contact_page',
        status: 'new',
      })
      .returning();
    return row;
  },

  async update(id: string, data: UpdateContactMessageInput) {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (data.status !== undefined) patch.status = data.status;
    if (data.adminNotes !== undefined) patch.adminNotes = data.adminNotes;

    const [row] = await db.update(contactMessages).set(patch).where(eq(contactMessages.id, id)).returning();
    return row;
  },

  async remove(id: string) {
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
  },
};
