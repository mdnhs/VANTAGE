import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { notFound } from 'next/navigation';
import { adminUserService } from '@/server/services/admin-user-service';
import { EditAdminUserForm } from '@/features/admin-users/components/edit';

export const metadata: Metadata = {
  title: 'Edit admin',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

interface EditAdminUserPageProps {
  params: Promise<{ id: string }>;
}

// Detail page: calls the service directly rather than fetching the API route.
export default async function EditAdminUserPage({ params }: EditAdminUserPageProps) {
  const actor = await requirePermission(permissionFor('/dashboard/admins/[id]/edit'));
  const { id } = await params;
  const adminUser = await adminUserService.byId(id);
  if (!adminUser) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-xl font-semibold'>Edit admin</h1>
        <p className='text-sm text-muted-foreground'>{adminUser.name}</p>
      </div>
      <EditAdminUserForm adminUser={adminUser} currentUserId={actor.userId} />
    </div>
  );
}
