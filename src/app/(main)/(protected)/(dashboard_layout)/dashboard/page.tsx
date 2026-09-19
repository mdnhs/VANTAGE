import type { Metadata } from 'next';
import { getSession } from '@/lib/permission/server-utils';
import { analyticsService } from '@/server/services/analytics-service';
import { DashboardOverviewView } from '@/features/dashboard-overview/components/dashboard-overview-view';

export const metadata: Metadata = {
  title: 'Operations Dashboard',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via the layout) per request — must not be prerendered.
export const instant = false;

export default async function DashboardPage() {
  const [session, data] = await Promise.all([getSession(), analyticsService.getOverviewData()]);

  return <DashboardOverviewView adminName={session?.name} data={data} />;
}
