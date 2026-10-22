import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { CreateHomepagePillarForm } from '@/features/homepage-pillars/components/create';

export const metadata: Metadata = {
  title: 'Add homepage pillar',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

export default async function CreateHomepagePillarPage() {
  await requirePermission(permissionFor('/dashboard/homepage-pillars/create'));
  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title='Add homepage pillar' description='Add a new feature-pillar card shown on the homepage.' />
      <CreateHomepagePillarForm />
    </div>
  );
}
