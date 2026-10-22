import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { notFound } from 'next/navigation';
import { homepagePillarService } from '@/server/services/homepage-pillar-service';
import { EditHomepagePillarForm } from '@/features/homepage-pillars/components/edit';

export const metadata: Metadata = {
  title: 'Edit homepage pillar',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

interface EditHomepagePillarPageProps {
  params: Promise<{ id: string }>;
}

// Detail page: calls the service directly rather than fetching the API route.
export default async function EditHomepagePillarPage({ params }: EditHomepagePillarPageProps) {
  await requirePermission(permissionFor('/dashboard/homepage-pillars/[id]/edit'));
  const { id } = await params;
  const pillar = await homepagePillarService.byId(id);
  if (!pillar) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title='Edit homepage pillar' description={pillar.title} />
      <EditHomepagePillarForm pillar={pillar} />
    </div>
  );
}
