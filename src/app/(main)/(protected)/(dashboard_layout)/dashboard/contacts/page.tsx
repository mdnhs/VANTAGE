import type { Metadata } from 'next';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { contactMessageService } from '@/server/services/contact-message-service';
import { ContactInboxView } from '@/features/contact-messages/components/inbox/contact-inbox-view';

export const metadata: Metadata = {
  title: 'Contact Messages Inbox',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function ContactsPage() {
  const [contactsData, stats] = await Promise.all([
    contactMessageService.list({ page: 1, limit: 50, status: 'all' }),
    contactMessageService.stats(),
  ]);

  return (
    <PermissionGate
      permissions={[PERMISSIONS.CONTACTS_MANAGE, PERMISSIONS.ADMINS_MANAGE]}
      fallback={<p>You do not have access to this page.</p>}
    >
      <ContactInboxView initialData={{ data: contactsData.rows, total: contactsData.total }} initialStats={stats} />
    </PermissionGate>
  );
}
