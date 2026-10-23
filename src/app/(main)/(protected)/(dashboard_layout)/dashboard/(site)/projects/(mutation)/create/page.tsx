import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { CreateProjectForm } from '@/features/projects/components/create';

export const metadata: Metadata = {
  title: 'Add project',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

export default async function CreateProjectPage() {
  await requirePermission(permissionFor('/dashboard/projects/create'));
  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title='Add project' description='Create a new before/after project for the public site.' />
      <CreateProjectForm />
    </div>
  );
}
