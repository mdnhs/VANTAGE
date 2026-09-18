import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { homepageCatalogService } from '@/server/services/homepage-catalog-service';
import { EditHomepageCatalogForm } from '@/features/homepage-catalogs/components/edit';

export const metadata: Metadata = {
  title: 'Edit homepage catalog item',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

interface EditHomepageCatalogPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditHomepageCatalogPage({ params }: EditHomepageCatalogPageProps) {
  const { id } = await params;
  const catalog = await homepageCatalogService.byId(id);
  if (!catalog) notFound();

  return (
    <PermissionGate
      permissions={[PERMISSIONS.CATALOG_MANAGE, PERMISSIONS.ADMINS_MANAGE]}
      fallback={<p>You do not have access to this page.</p>}
    >
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Edit homepage catalog item</h1>
          <p className='text-sm text-muted-foreground'>{catalog.title}</p>
        </div>
        <EditHomepageCatalogForm catalog={catalog} />
      </div>
    </PermissionGate>
  );
}
