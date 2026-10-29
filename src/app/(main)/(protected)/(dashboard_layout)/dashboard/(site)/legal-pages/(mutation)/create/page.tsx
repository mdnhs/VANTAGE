import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { CreateLegalPageForm } from '@/features/legal-pages/components/create';

export const metadata: Metadata = {
  title: 'Add legal page',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

export default async function CreateLegalPagePage() {
  await requirePermission(permissionFor('/dashboard/legal-pages/create'));
  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title='Add legal page' description='Write the page, then publish it to add it to the footer.' />
      <CreateLegalPageForm />
    </div>
  );
}
