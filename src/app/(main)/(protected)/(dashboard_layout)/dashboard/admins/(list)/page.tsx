import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { adminUserService } from '@/server/services/admin-user-service';
import { AdminUserTable } from '@/features/admin-users/components/list/admin-user-table';

export const metadata: Metadata = {
  title: 'Admins',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

export default async function AdminUsersListPage() {
  const actor = await requirePermission(permissionFor('/dashboard/admins'));
  const admins = await adminUserService.list();

  return (
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
      <AdminUserTable initialData={admins} currentUserId={actor.userId} />
    </div>
  );
}
