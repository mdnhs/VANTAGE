import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { notFound } from 'next/navigation';
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
  await requirePermission(permissionFor('/dashboard/homepage-catalogs/[id]/edit'));
  const { id } = await params;
  const catalog = await homepageCatalogService.byId(id);
  if (!catalog) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title='Edit homepage catalog item' description={catalog.title} />
      <EditHomepageCatalogForm catalog={catalog} />
    </div>
  );
}
