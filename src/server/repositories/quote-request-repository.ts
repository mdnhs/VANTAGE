import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { quoteRequests } from '@/server/db/schema';
import type {
  CreateQuoteRequestOutput,
  QuoteRequestListQuery,
  UpdateQuoteRequestOutput,
} from '@/validations/quote-request-schema';
import type { QuoteRequestStats } from '@/features/quote-requests/types';

export const quoteRequestRepository = {
  async list({ page, limit, status, search, assignedAdminId }: QuoteRequestListQuery) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(eq(quoteRequests.status, status));
    }

    if (assignedAdminId) {
      conditions.push(eq(quoteRequests.assignedAdminId, assignedAdminId));
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
          ilike(quoteRequests.city, q),
          ilike(quoteRequests.eircode, q),
          ilike(quoteRequests.invoiceNumber, q),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ count }]] = await Promise.all([
      db.query.quoteRequests.findMany({
        where: whereClause,
        orderBy: [desc(quoteRequests.createdAt)],
        with: {
          assignedAdmin: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
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
      waiting_response: 0,
      quote_sent: 0,
      approved: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const r of rows) {
      if (r.status in counts) {
        counts[r.status as keyof QuoteRequestStats] = r.count;
      } else if (r.status === 'quoted') {
        counts.quote_sent += r.count;
      } else if (r.status === 'archived') {
        counts.cancelled += r.count;
      }
      counts.all += r.count;
    }

    return counts;
  },

  async byId(id: string) {
    return db.query.quoteRequests.findFirst({
      where: eq(quoteRequests.id, id),
      with: {
        assignedAdmin: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  },

  async create(data: CreateQuoteRequestOutput) {
    const [row] = await db
      .insert(quoteRequests)
      .values({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address || null,
        city: data.city || null,
        eircode: data.eircode || null,
        registration: data.registration || null,
        make: data.make || null,
        model: data.model || null,
        year: typeof data.year === 'number' ? data.year : null,
        serviceType: data.serviceType || null,
        description: data.description || null,
        photoUrls: data.photoUrls || [],
        source: data.source || 'website',
        status: data.status || 'new',
        assignedAdminId: data.assignedAdminId || null,
        inspectionDate: data.inspectionDate ?? null,
        estimatedCost:
          data.estimatedCost !== undefined && data.estimatedCost !== null ? String(data.estimatedCost) : null,
        paymentStatus: data.paymentStatus || 'unpaid',
        paidAmount: data.paidAmount !== undefined && data.paidAmount !== null ? String(data.paidAmount) : '0.00',
        paymentMethod: data.paymentMethod || null,
        invoiceNumber: data.invoiceNumber || null,
        completedAt: data.completedAt ?? null,
        adminNotes: data.adminNotes || null,
      })
      .returning();
    return this.byId(row.id);
  },

  async update(id: string, data: UpdateQuoteRequestOutput) {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (data.status !== undefined) patch.status = data.status;
    if (data.address !== undefined) patch.address = data.address;
    if (data.city !== undefined) patch.city = data.city;
    if (data.eircode !== undefined) patch.eircode = data.eircode;
    if (data.assignedAdminId !== undefined) patch.assignedAdminId = data.assignedAdminId;
    if (data.inspectionDate !== undefined) patch.inspectionDate = data.inspectionDate;
    if (data.estimatedCost !== undefined)
      patch.estimatedCost = data.estimatedCost !== null ? String(data.estimatedCost) : null;
    if (data.paymentStatus !== undefined) patch.paymentStatus = data.paymentStatus;
    if (data.paidAmount !== undefined) patch.paidAmount = data.paidAmount !== null ? String(data.paidAmount) : '0.00';
    if (data.paymentMethod !== undefined) patch.paymentMethod = data.paymentMethod;
    if (data.invoiceNumber !== undefined) patch.invoiceNumber = data.invoiceNumber;
    if (data.completedAt !== undefined) patch.completedAt = data.completedAt;
    if (data.adminNotes !== undefined) patch.adminNotes = data.adminNotes;

    await db.update(quoteRequests).set(patch).where(eq(quoteRequests.id, id));
    return this.byId(id);
  },

  async remove(id: string) {
    await db.delete(quoteRequests).where(eq(quoteRequests.id, id));
  },
};
