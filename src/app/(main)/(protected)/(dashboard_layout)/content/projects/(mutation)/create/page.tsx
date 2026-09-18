import type { Metadata } from 'next';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { CreateProjectForm } from '@/features/projects/components/create';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function CreateProjectPage() {
  return (
    <PermissionGate permissions={[PERMISSIONS.PROJECTS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Add project</h1>
          <p className='text-sm text-muted-foreground'>Create a new before/after project for the public site.</p>
        </div>
        <CreateProjectForm />
      </div>
    </PermissionGate>
  );
}
