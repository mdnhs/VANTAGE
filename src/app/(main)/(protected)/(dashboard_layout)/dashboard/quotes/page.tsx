import type { Metadata } from 'next';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { quoteRequestService } from '@/server/services/quote-request-service';
import { QuoteInboxView } from '@/features/quote-requests/components/inbox/quote-inbox-view';

export const metadata: Metadata = {
  title: 'Quote Requests Inbox',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function QuotesPage() {
  const [quotesData, stats] = await Promise.all([
    quoteRequestService.list({ page: 1, limit: 50, status: 'all' }),
    quoteRequestService.stats(),
  ]);

  return (
    <PermissionGate
      permissions={[PERMISSIONS.QUOTES_MANAGE, PERMISSIONS.ADMINS_MANAGE]}
      fallback={<p>You do not have access to this page.</p>}
    >
      <QuoteInboxView initialData={{ data: quotesData.rows, total: quotesData.total }} initialStats={stats} />
    </PermissionGate>
  );
}
