import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { getSession } from '@/lib/permission/server-utils';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { adminUserService } from '@/server/services/admin-user-service';
import { AdminUserTable } from '@/features/admin-users/components/list/admin-user-table';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via PermissionGate/getSession) per request — must not be
// prerendered.
export const instant = false;

export default async function AdminUsersListPage() {
  const [admins, session] = await Promise.all([adminUserService.list(), getSession()]);

  return (
    <PermissionGate permissions={[PERMISSIONS.ADMINS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-xl font-semibold'>Admins</h1>
            <p className='text-sm text-muted-foreground'>Manage dashboard admin users and their permissions.</p>
          </div>
          <Link href={APP_ROUTES.content.admins.create} className={cn(buttonVariants())}>
            Add admin
          </Link>
        </div>
        <AdminUserTable initialData={admins} currentUserId={session?.id ?? ''} />
      </div>
    </PermissionGate>
  );
}
