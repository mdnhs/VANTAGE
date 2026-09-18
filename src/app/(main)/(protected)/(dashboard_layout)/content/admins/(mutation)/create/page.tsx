import type { Metadata } from 'next';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { CreateAdminUserForm } from '@/features/admin-users/components/create';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function CreateAdminUserPage() {
  return (
    <PermissionGate permissions={[PERMISSIONS.ADMINS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Add admin</h1>
          <p className='text-sm text-muted-foreground'>Create a new dashboard admin user.</p>
        </div>
        <CreateAdminUserForm />
      </div>
    </PermissionGate>
  );
}
