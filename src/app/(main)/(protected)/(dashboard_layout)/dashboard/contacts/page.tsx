import type { Metadata } from 'next';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { contactMessageService } from '@/server/services/contact-message-service';
import { ContactMessageTable } from '@/features/contact-messages/components/list/contact-message-table';

export const metadata: Metadata = {
  title: 'Contact Inquiries',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function ContactsPage() {
  const [contactsData, stats] = await Promise.all([
    contactMessageService.list({ page: 1, limit: 25, status: 'all' }),
    contactMessageService.stats(),
  ]);

  return (
    <PermissionGate
      permissions={[PERMISSIONS.CONTACTS_MANAGE, PERMISSIONS.ADMINS_MANAGE]}
      fallback={<p>You do not have access to this page.</p>}
    >
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Contact Inquiries</h1>
          <p className='text-sm text-muted-foreground'>
            General messages, service inquiries, and questions submitted via the Contact page.
          </p>
        </div>

        <ContactMessageTable
          initialData={{ data: contactsData.rows, total: contactsData.total }}
          initialStats={stats}
        />
      </div>
    </PermissionGate>
  );
}
