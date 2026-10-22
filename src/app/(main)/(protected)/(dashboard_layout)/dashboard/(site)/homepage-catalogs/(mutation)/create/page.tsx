import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { CreateHomepageCatalogForm } from '@/features/homepage-catalogs/components/create';

export const metadata: Metadata = {
  title: 'Add homepage catalog item',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function CreateHomepageCatalogPage() {
  await requirePermission(permissionFor('/dashboard/homepage-catalogs/create'));
  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Add homepage catalog item'
        description='Add a new service item to be displayed in the homepage catalog grid.'
      />
      <CreateHomepageCatalogForm />
    </div>
  );
}
