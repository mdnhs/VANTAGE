import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { CreateServiceForm } from '@/features/services/components/create';

export const metadata: Metadata = {
  title: 'Add service',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

export default async function CreateServicePage() {
  await requirePermission(permissionFor('/dashboard/services/create'));
  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title='Add service' description='Create a new service shown on the public site.' />
      <CreateServiceForm />
    </div>
  );
}
