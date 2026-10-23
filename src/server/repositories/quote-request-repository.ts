import { and, desc, eq, ilike, ne, or, sql } from 'drizzle-orm';
import { SPAM_STATUS, type SpamReason } from '@/lib/enquiries/spam';
import { db } from '@/server/db';
import { quoteRequests } from '@/server/db/schema';
import { noBillingData, SPAM_BILLING_ERROR } from '@/server/lib/enquiries/billing';
import { attachPhotos, linkEnquiryPhotos } from '@/server/lib/media/enquiry-photos';
import type {
  CreateQuoteRequestOutput,
  QuoteRequestListQuery,
  UpdateQuoteRequestOutput,
} from '@/validations/quote-request-schema';
import type { QuoteRequestStats } from '@/features/quote-requests/types';

export const quoteRequestRepository = {
  async list({ page, limit, status, search, assignedUserId }: QuoteRequestListQuery) {
    const offset = (page - 1) * limit;
    const conditions = [];

    // 'all' leaves spam out; it is listed only on its own.
    conditions.push(
      status && status !== 'all' ? eq(quoteRequests.status, status) : ne(quoteRequests.status, SPAM_STATUS),
    );

    if (assignedUserId) {
      conditions.push(eq(quoteRequests.assignedUserId, assignedUserId));
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
          assignedUser: {
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

    return { rows: await attachPhotos('quoteRequestId', rows), total: count };
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
      spam: 0,
    };

    for (const r of rows) {
      // Spam is counted on its own: it is in neither the total nor 'new'.
      if (r.status === SPAM_STATUS) {
        counts.spam = r.count;
        continue;
      }
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
    const row = await db.query.quoteRequests.findFirst({
      where: eq(quoteRequests.id, id),
      with: {
        assignedUser: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    if (!row) return undefined;
    const [withPhotos] = await attachPhotos('quoteRequestId', [row]);
    return withPhotos;
  },

  async create(data: CreateQuoteRequestOutput, photoMediaIds: string[] = [], spamReason?: SpamReason) {
    const row = await db.transaction(async (tx) => {
      const [inserted] = await tx
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
          source: data.source || 'website',
          status: spamReason ? SPAM_STATUS : data.status || 'new',
          spamReason: spamReason ?? null,
          assignedUserId: data.assignedUserId || null,
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
      await linkEnquiryPhotos(tx, { quoteRequestId: inserted!.id }, photoMediaIds);
      return inserted!;
    });
    return this.byId(row.id);
  },

  async update(id: string, data: UpdateQuoteRequestOutput) {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (data.status !== undefined) {
      patch.status = data.status;
      // Spam marked by staff says so; leaving spam clears the reason.
      const [current] = await db
        .select({ status: quoteRequests.status, spamReason: quoteRequests.spamReason })
        .from(quoteRequests)
        .where(eq(quoteRequests.id, id));
      if (data.status === SPAM_STATUS)
        patch.spamReason = current?.status === SPAM_STATUS ? current.spamReason : 'manual';
      else if (current?.status === SPAM_STATUS) patch.spamReason = null;
    }
    if (data.address !== undefined) patch.address = data.address;
    if (data.city !== undefined) patch.city = data.city;
    if (data.eircode !== undefined) patch.eircode = data.eircode;
    if (data.assignedUserId !== undefined) patch.assignedUserId = data.assignedUserId;
    if (data.inspectionDate !== undefined) patch.inspectionDate = data.inspectionDate;
    if (data.estimatedCost !== undefined)
      patch.estimatedCost = data.estimatedCost !== null ? String(data.estimatedCost) : null;
    if (data.paymentStatus !== undefined) patch.paymentStatus = data.paymentStatus;
    if (data.paidAmount !== undefined) patch.paidAmount = data.paidAmount !== null ? String(data.paidAmount) : '0.00';
    if (data.paymentMethod !== undefined) patch.paymentMethod = data.paymentMethod;
    if (data.invoiceNumber !== undefined) patch.invoiceNumber = data.invoiceNumber;
    if (data.completedAt !== undefined) patch.completedAt = data.completedAt;
    if (data.adminNotes !== undefined) patch.adminNotes = data.adminNotes;

    // Moving a quote to spam only matches one with no billing data (or one already spam).
    const where =
      data.status === SPAM_STATUS
        ? and(eq(quoteRequests.id, id), or(eq(quoteRequests.status, SPAM_STATUS), noBillingData()))
        : eq(quoteRequests.id, id);
    const updated = await db.update(quoteRequests).set(patch).where(where).returning({ id: quoteRequests.id });
    if (updated.length === 0 && data.status === SPAM_STATUS) {
      const [exists] = await db.select({ id: quoteRequests.id }).from(quoteRequests).where(eq(quoteRequests.id, id));
      if (exists) throw SPAM_BILLING_ERROR();
      return undefined;
    }
    return this.byId(id);
  },

  async remove(id: string) {
    await db.delete(quoteRequests).where(eq(quoteRequests.id, id));
  },
};
