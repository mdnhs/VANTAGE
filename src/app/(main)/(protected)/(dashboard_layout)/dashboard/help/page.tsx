import type { Metadata } from 'next';

import { PageHeader } from '@/components/admin/dashboard/page-header';
import { HelpView } from '@/features/help/components/help-view';
import { listOwnerContacts } from '@/features/help/owner-contacts';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Help',
  robots: { index: false, follow: false, nocache: true },
};

export default async function HelpPage() {
  await requirePermission(permissionFor('/dashboard/help'));
  const owners = await listOwnerContacts();
  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title='Help' description='How-to answers, shortcuts, and who to ask.' />
      <HelpView owners={owners} />
    </div>
  );
}
