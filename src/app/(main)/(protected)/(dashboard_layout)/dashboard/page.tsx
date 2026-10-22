import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { analyticsService } from '@/server/services/analytics-service';
import { DashboardOverviewView } from '@/features/dashboard-overview/components/dashboard-overview-view';

export const metadata: Metadata = {
  title: 'Operations Dashboard',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via the layout) per request — must not be prerendered.
export const instant = false;

export default async function DashboardPage() {
  const actor = await requirePermission(permissionFor('/dashboard'));
  const data = await analyticsService.getOverviewData();

  return <DashboardOverviewView adminName={actor.name} data={data} />;
}
