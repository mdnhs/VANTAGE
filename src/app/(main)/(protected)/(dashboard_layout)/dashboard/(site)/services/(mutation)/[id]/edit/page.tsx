import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { notFound } from 'next/navigation';
import { serviceService } from '@/server/services/service-service';
import { EditServiceForm } from '@/features/services/components/edit';

export const metadata: Metadata = {
  title: 'Edit service',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

// Detail page: calls the service directly rather than fetching the API route.
export default async function EditServicePage({ params }: EditServicePageProps) {
  await requirePermission(permissionFor('/dashboard/services/[id]/edit'));
  const { id } = await params;
  const service = await serviceService.byId(id);
  if (!service) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-xl font-semibold'>Edit service</h1>
        <p className='text-sm text-muted-foreground'>{service.name}</p>
      </div>
      <EditServiceForm service={service} />
    </div>
  );
}
