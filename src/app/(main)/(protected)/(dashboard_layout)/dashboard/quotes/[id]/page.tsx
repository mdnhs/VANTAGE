import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { notFound } from 'next/navigation';
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
  await requirePermission(permissionFor('/dashboard/quotes/[id]'));
  const { id } = await params;
  const quote = await quoteRequestService.byId(id);
  if (!quote) notFound();

  return <QuoteDetailView quote={quote} />;
}
