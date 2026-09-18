import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { homepagePillarService } from '@/server/services/homepage-pillar-service';
import { EditHomepagePillarForm } from '@/features/homepage-pillars/components/edit';

export const metadata: Metadata = {
  title: 'Edit homepage pillar',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via PermissionGate/getSession) per request — must not be
// prerendered.
export const instant = false;

interface EditHomepagePillarPageProps {
  params: Promise<{ id: string }>;
}

// Detail page: calls the service directly rather than fetching the API route.
export default async function EditHomepagePillarPage({ params }: EditHomepagePillarPageProps) {
  const { id } = await params;
  const pillar = await homepagePillarService.byId(id);
  if (!pillar) notFound();

  return (
    <PermissionGate permissions={[PERMISSIONS.PILLARS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Edit homepage pillar</h1>
          <p className='text-sm text-muted-foreground'>{pillar.title}</p>
        </div>
        <EditHomepagePillarForm pillar={pillar} />
      </div>
    </PermissionGate>
  );
}
