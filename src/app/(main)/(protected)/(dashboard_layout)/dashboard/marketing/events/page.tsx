import type { Metadata } from 'next';

import { EventsView } from '@/features/marketing/components/events-view';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requireActor, requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Event catalogue',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function EventsPage() {
  const path = '/dashboard/marketing/events';
  await requireActor(path);
  await requirePermission(permissionFor(path), path);
  return <EventsView />;
}
