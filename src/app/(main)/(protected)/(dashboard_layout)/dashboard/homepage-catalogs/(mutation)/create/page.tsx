import type { Metadata } from 'next';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { CreateHomepageCatalogForm } from '@/features/homepage-catalogs/components/create';

export const metadata: Metadata = {
  title: 'Add homepage catalog item',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default function CreateHomepageCatalogPage() {
  return (
    <PermissionGate
      permissions={[PERMISSIONS.CATALOG_MANAGE, PERMISSIONS.ADMINS_MANAGE]}
      fallback={<p>You do not have access to this page.</p>}
    >
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Add homepage catalog item</h1>
          <p className='text-sm text-muted-foreground'>
            Add a new service item to be displayed in the homepage catalog grid.
          </p>
        </div>
        <CreateHomepageCatalogForm />
      </div>
    </PermissionGate>
  );
}
