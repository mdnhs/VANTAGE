import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { CreateAdminUserForm } from '@/features/admin-users/components/create';

export const metadata: Metadata = {
  title: 'Add admin',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

export default async function CreateAdminUserPage() {
  await requirePermission(permissionFor('/dashboard/admins/create'));
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-xl font-semibold'>Add admin</h1>
        <p className='text-sm text-muted-foreground'>Create a new dashboard admin user.</p>
      </div>
      <CreateAdminUserForm />
    </div>
  );
}
