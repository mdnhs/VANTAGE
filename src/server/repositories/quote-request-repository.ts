import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { quoteRequests } from '@/server/db/schema';
import type {
  CreateQuoteRequestInput,
  QuoteRequestListQuery,
  UpdateQuoteRequestInput,
} from '@/validations/quote-request-schema';
import type { QuoteRequestStats } from '@/features/quote-requests/types';

export const quoteRequestRepository = {
  async list({ page, limit, status, search }: QuoteRequestListQuery) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(eq(quoteRequests.status, status));
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(quoteRequests.name, q),
          ilike(quoteRequests.email, q),
          ilike(quoteRequests.phone, q),
          ilike(quoteRequests.registration, q),
          ilike(quoteRequests.make, q),
          ilike(quoteRequests.model, q),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ count }]] = await Promise.all([
      db.query.quoteRequests.findMany({
        where: whereClause,
        orderBy: [desc(quoteRequests.createdAt)],
        limit,
        offset,
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(quoteRequests)
        .where(whereClause),
    ]);

    return { rows, total: count };
  },

  async stats(): Promise<QuoteRequestStats> {
    const rows = await db
      .select({
        status: quoteRequests.status,
        count: sql<number>`count(*)::int`,
      })
      .from(quoteRequests)
      .groupBy(quoteRequests.status);

    const counts: QuoteRequestStats = {
      all: 0,
      new: 0,
      contacted: 0,
      in_progress: 0,
      quoted: 0,
      completed: 0,
      archived: 0,
    };

    for (const r of rows) {
      if (r.status in counts) {
        counts[r.status as keyof QuoteRequestStats] = r.count;
      }
      counts.all += r.count;
    }

    return counts;
  },

  async byId(id: string) {
    return db.query.quoteRequests.findFirst({ where: eq(quoteRequests.id, id) });
  },

  async create(data: CreateQuoteRequestInput) {
    const [row] = await db
      .insert(quoteRequests)
      .values({
        name: data.name,
        email: data.email,
        phone: data.phone,
        registration: data.registration || null,
        make: data.make || null,
        model: data.model || null,
        year: typeof data.year === 'number' ? data.year : null,
        serviceType: data.serviceType || null,
        description: data.description || null,
        photoUrls: data.photoUrls || [],
        source: data.source || 'website',
        status: 'new',
      })
      .returning();
    return row;
  },

  async update(id: string, data: UpdateQuoteRequestInput) {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (data.status !== undefined) patch.status = data.status;
    if (data.estimatedCost !== undefined)
      patch.estimatedCost = data.estimatedCost !== null ? String(data.estimatedCost) : null;
    if (data.adminNotes !== undefined) patch.adminNotes = data.adminNotes;

    const [row] = await db.update(quoteRequests).set(patch).where(eq(quoteRequests.id, id)).returning();
    return row;
  },

  async remove(id: string) {
    await db.delete(quoteRequests).where(eq(quoteRequests.id, id));
  },
};
