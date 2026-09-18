import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { quoteRequestService } from '@/server/services/quote-request-service';
import { QuoteDetailView } from '@/features/quote-requests/components/detail/quote-detail-view';

export const metadata: Metadata = {
  title: 'Quote Request Details',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params;
  const quote = await quoteRequestService.byId(id);
  if (!quote) notFound();

  return (
    <PermissionGate
      permissions={[PERMISSIONS.QUOTES_MANAGE, PERMISSIONS.ADMINS_MANAGE]}
      fallback={<p>You do not have access to this page.</p>}
    >
      <QuoteDetailView quote={quote} />
    </PermissionGate>
  );
}
