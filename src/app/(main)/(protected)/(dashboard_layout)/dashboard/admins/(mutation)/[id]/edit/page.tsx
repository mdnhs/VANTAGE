import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { getSession } from '@/lib/permission/server-utils';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { adminUserService } from '@/server/services/admin-user-service';
import { EditAdminUserForm } from '@/features/admin-users/components/edit';

export const metadata: Metadata = {
  title: 'Edit admin',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via PermissionGate/getSession) per request — must not be
// prerendered.
export const instant = false;

interface EditAdminUserPageProps {
  params: Promise<{ id: string }>;
}

// Detail page: calls the service directly rather than fetching the API route.
export default async function EditAdminUserPage({ params }: EditAdminUserPageProps) {
  const { id } = await params;
  const [adminUser, session] = await Promise.all([adminUserService.byId(id), getSession()]);
  if (!adminUser) notFound();

  return (
    <PermissionGate permissions={[PERMISSIONS.ADMINS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Edit admin</h1>
          <p className='text-sm text-muted-foreground'>{adminUser.name}</p>
        </div>
        <EditAdminUserForm adminUser={adminUser} currentUserId={session?.id ?? ''} />
      </div>
    </PermissionGate>
  );
}
