import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { contactMessageService } from '@/server/services/contact-message-service';
import { ContactInboxView } from '@/features/contact-messages/components/inbox/contact-inbox-view';

export const metadata: Metadata = {
  title: 'Contact Messages Inbox',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function ContactsPage() {
  await requirePermission(permissionFor('/dashboard/contacts'));
  const [contactsData, stats] = await Promise.all([
    contactMessageService.list({ page: 1, limit: 50, status: 'all' }),
    contactMessageService.stats(),
  ]);

  return <ContactInboxView initialData={{ data: contactsData.rows, total: contactsData.total }} initialStats={stats} />;
}
