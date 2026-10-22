import type { Metadata } from 'next';

import { AccountView } from '@/features/account/components/account-view';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

// Every role manages their own profile, password and devices; gated by the
// registry entry that lists the link, so the two cannot drift.
export default async function AccountPage() {
  await requirePermission(permissionFor('/dashboard/account'));
  return <AccountView />;
}
