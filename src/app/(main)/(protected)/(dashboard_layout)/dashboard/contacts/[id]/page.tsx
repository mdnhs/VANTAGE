import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { notFound } from 'next/navigation';
import { contactMessageService } from '@/server/services/contact-message-service';
import { ContactDetailView } from '@/features/contact-messages/components/detail/contact-detail-view';

export const metadata: Metadata = {
  title: 'Contact Inquiry Details',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

interface ContactDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  await requirePermission(permissionFor('/dashboard/contacts/[id]'));
  const { id } = await params;
  const message = await contactMessageService.byId(id);
  if (!message) notFound();

  return <ContactDetailView message={message} />;
}
