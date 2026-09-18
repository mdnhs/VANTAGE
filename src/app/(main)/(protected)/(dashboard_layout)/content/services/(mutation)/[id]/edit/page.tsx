import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { serviceService } from '@/server/services/service-service';
import { EditServiceForm } from '@/features/services/components/edit';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

// Detail page: calls the service directly rather than fetching the API route.
export default async function EditServicePage({ params }: EditServicePageProps) {
  const { id } = await params;
  const service = await serviceService.byId(id);
  if (!service) notFound();

  return (
    <PermissionGate permissions={[PERMISSIONS.SERVICES_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Edit service</h1>
          <p className='text-sm text-muted-foreground'>{service.name}</p>
        </div>
        <EditServiceForm service={service} />
      </div>
    </PermissionGate>
  );
}
