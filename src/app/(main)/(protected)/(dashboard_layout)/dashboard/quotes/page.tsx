import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { quoteRequestService } from '@/server/services/quote-request-service';
import { QuoteInboxView } from '@/features/quote-requests/components/inbox/quote-inbox-view';

export const metadata: Metadata = {
  title: 'Quote Requests Inbox',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function QuotesPage() {
  await requirePermission(permissionFor('/dashboard/quotes'));
  const [quotesData, stats] = await Promise.all([
    quoteRequestService.list({ page: 1, limit: 50, status: 'all' }),
    quoteRequestService.stats(),
  ]);

  return <QuoteInboxView initialData={{ data: quotesData.rows, total: quotesData.total }} initialStats={stats} />;
}
