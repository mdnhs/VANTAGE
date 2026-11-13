import type { Metadata } from 'next';

import { HelpOverview } from '@/features/help/components/help-view';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requirePermission } from '@/server/lib/auth/session';

// Reads the session per request (auth check + the role's articles).
export const instant = false;

export const metadata: Metadata = {
  title: 'Help',
  robots: { index: false, follow: false, nocache: true },
};

export default async function HelpPage() {
  const actor = await requirePermission(permissionFor('/dashboard/help'));
  return <HelpOverview roles={actor.roles} />;
}
