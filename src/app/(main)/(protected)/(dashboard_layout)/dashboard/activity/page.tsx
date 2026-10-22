import type { Metadata } from 'next';

import { ActivityView } from '@/features/activity/components/activity-view';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Activity log',
  robots: { index: false, follow: false, nocache: true },
};

export default async function ActivityPage() {
  await requirePermission(permissionFor('/dashboard/activity'));
  return <ActivityView />;
}
