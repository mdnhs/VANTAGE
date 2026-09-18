import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
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
  const { id } = await params;
  const message = await contactMessageService.byId(id);
  if (!message) notFound();

  return (
    <PermissionGate
      permissions={[PERMISSIONS.CONTACTS_MANAGE, PERMISSIONS.ADMINS_MANAGE]}
      fallback={<p>You do not have access to this page.</p>}
    >
      <ContactDetailView message={message} />
    </PermissionGate>
  );
}
