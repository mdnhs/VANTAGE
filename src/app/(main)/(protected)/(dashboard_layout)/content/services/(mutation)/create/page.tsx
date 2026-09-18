import type { Metadata } from 'next';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { CreateServiceForm } from '@/features/services/components/create';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function CreateServicePage() {
  return (
    <PermissionGate permissions={[PERMISSIONS.SERVICES_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Add service</h1>
          <p className='text-sm text-muted-foreground'>Create a new service shown on the public site.</p>
        </div>
        <CreateServiceForm />
      </div>
    </PermissionGate>
  );
}
