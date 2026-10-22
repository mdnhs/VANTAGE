import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { CreatePartnerLogoForm } from '@/features/partner-logos/components/create';

export const metadata: Metadata = {
  title: 'Add partner logo',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

export default async function CreatePartnerLogoPage() {
  await requirePermission(permissionFor('/dashboard/partner-logos/create'));
  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title='Add partner logo' description='Add a new insurance or partner company logo.' />
      <CreatePartnerLogoForm />
    </div>
  );
}
