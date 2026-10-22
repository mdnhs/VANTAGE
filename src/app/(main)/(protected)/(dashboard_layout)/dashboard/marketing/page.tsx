import type { Metadata } from 'next';

import { TrackingView } from '@/features/marketing/components/tracking-view';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requireActor, requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Tracking',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function TrackingPage() {
  const path = '/dashboard/marketing';
  await requireActor(path);
  await requirePermission(permissionFor(path), path);
  return <TrackingView />;
}
