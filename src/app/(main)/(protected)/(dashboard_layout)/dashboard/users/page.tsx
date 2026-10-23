import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { UsersView } from '@/features/users/components/users-view';

export const metadata: Metadata = {
  title: 'Users & roles',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function UsersPage() {
  await requirePermission(permissionFor('/dashboard/users'));
  return <UsersView />;
}
