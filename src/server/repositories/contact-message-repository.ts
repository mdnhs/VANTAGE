import { and, desc, eq, ilike, ne, or, sql } from 'drizzle-orm';
import { SPAM_STATUS, type SpamReason } from '@/lib/enquiries/spam';
import { db } from '@/server/db';
import { contactMessages } from '@/server/db/schema';
import { attachPhotos, linkEnquiryPhotos } from '@/server/lib/media/enquiry-photos';
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

    // 'all' leaves spam out; it is listed only on its own.
    conditions.push(
      status && status !== 'all' ? eq(contactMessages.status, status) : ne(contactMessages.status, SPAM_STATUS),
    );

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

    return { rows: await attachPhotos('contactMessageId', rows), total: count };
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
      spam: 0,
    };

    for (const r of rows) {
      // Spam is counted on its own: it is in neither the total nor 'new'.
      if (r.status === SPAM_STATUS) {
        counts.spam = r.count;
        continue;
      }
      if (r.status in counts) {
        counts[r.status as keyof ContactMessageStats] = r.count;
      }
      counts.all += r.count;
    }

    return counts;
  },

  async byId(id: string) {
    const row = await db.query.contactMessages.findFirst({ where: eq(contactMessages.id, id) });
    if (!row) return undefined;
    const [withPhotos] = await attachPhotos('contactMessageId', [row]);
    return withPhotos;
  },

  async create(data: CreateContactMessageInput, photoMediaIds: string[] = [], spamReason?: SpamReason) {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .insert(contactMessages)
        .values({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          service: data.service || null,
          message: data.message,
          source: data.source || 'contact_page',
          status: spamReason ? SPAM_STATUS : 'new',
          spamReason: spamReason ?? null,
        })
        .returning();
      await linkEnquiryPhotos(tx, { contactMessageId: row!.id }, photoMediaIds);
      return (await attachPhotos('contactMessageId', [row!]))[0]!;
    });
  },

  async update(id: string, data: UpdateContactMessageInput) {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (data.status !== undefined) {
      patch.status = data.status;
      // Spam marked by staff says so; leaving spam clears the reason.
      const [current] = await db
        .select({ status: contactMessages.status, spamReason: contactMessages.spamReason })
        .from(contactMessages)
        .where(eq(contactMessages.id, id));
      if (data.status === SPAM_STATUS)
        patch.spamReason = current?.status === SPAM_STATUS ? current.spamReason : 'manual';
      else if (current?.status === SPAM_STATUS) patch.spamReason = null;
    }
    if (data.adminNotes !== undefined) patch.adminNotes = data.adminNotes;

    const [row] = await db.update(contactMessages).set(patch).where(eq(contactMessages.id, id)).returning();
    return row ? (await attachPhotos('contactMessageId', [row]))[0] : undefined;
  },

  async remove(id: string) {
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
  },
};
