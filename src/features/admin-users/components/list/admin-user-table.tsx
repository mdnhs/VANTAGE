'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { useAdminUserList } from '../../hooks/api/query/use-admin-user-list';
import { useToggleAdminActive } from '../../hooks/api/mutation/use-toggle-admin-active';
import type { AdminUserWithPermissions } from '../../types';

interface AdminUserTableProps {
  initialData: AdminUserWithPermissions[];
  currentUserId: string;
}

// Inline active/inactive toggle needs its own mutation instance scoped to that row's id.
// Disabled entirely for the row matching the currently logged-in user — self-deactivation
// is blocked server-side too (see admin-user-service.ts `update`), but the control is
// disabled here so the user never even sees a 403.
function ActiveToggle({ adminUser, isSelf }: { adminUser: AdminUserWithPermissions; isSelf: boolean }) {
  const toggleActive = useToggleAdminActive(adminUser.id);
  return (
    <Switch
      checked={adminUser.isActive}
      disabled={isSelf || toggleActive.isPending}
      onCheckedChange={(checked) => toggleActive.mutate(checked)}
      aria-label={`${adminUser.isActive ? 'Deactivate' : 'Reactivate'} ${adminUser.name}`}
    />
  );
}

export function AdminUserTable({ initialData, currentUserId }: AdminUserTableProps) {
  const { data } = useAdminUserList();
  const rows = data ?? initialData;

  if (rows.length === 0) {
    return <p className='text-sm text-muted-foreground'>No admin users yet.</p>;
  }

  return (
    <div className='overflow-x-auto rounded-lg border border-border'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-border bg-muted/50 text-left text-muted-foreground'>
            <th className='px-4 py-2.5 font-medium'>Name</th>
            <th className='px-4 py-2.5 font-medium'>Email</th>
            <th className='px-4 py-2.5 font-medium'>Role</th>
            <th className='px-4 py-2.5 font-medium'>Active</th>
            <th className='px-4 py-2.5 text-right font-medium'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((adminUser) => {
            const isSelf = adminUser.id === currentUserId;
            return (
              <tr key={adminUser.id} className='border-b border-border last:border-0'>
                <td className='px-4 py-2.5 font-medium'>
                  {adminUser.name}
                  {isSelf && <span className='ml-2 text-xs text-muted-foreground'>(you)</span>}
                </td>
                <td className='px-4 py-2.5 text-muted-foreground'>{adminUser.email}</td>
                <td className='px-4 py-2.5 text-muted-foreground capitalize'>{adminUser.role}</td>
                <td className='px-4 py-2.5'>
                  <div className='flex items-center gap-2'>
                    <ActiveToggle adminUser={adminUser} isSelf={isSelf} />
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        adminUser.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {adminUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
                <td className='px-4 py-2.5'>
                  <div className='flex items-center justify-end gap-1'>
                    <Link
                      href={APP_ROUTES.content.admins.edit(adminUser.id)}
                      aria-label={`Edit ${adminUser.name}`}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                        isSelf && 'pointer-events-none opacity-50',
                      )}
                      aria-disabled={isSelf}
                    >
                      <Pencil className='size-4' />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
