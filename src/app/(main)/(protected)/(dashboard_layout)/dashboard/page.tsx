import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { getDashboard } from '@/server/services/dashboard-service';
import { DashboardOverviewView } from '@/features/dashboard-overview/components/dashboard-overview-view';
import type { DashboardDto } from '@/features/dashboard-overview/types';

export const metadata: Metadata = {
  title: 'Operations Dashboard',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via the layout) per request — must not be prerendered.
export const instant = false;

export default async function DashboardPage() {
  const actor = await requirePermission(permissionFor('/dashboard'));
  const renderedAt = new Date().toISOString();
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  let dashboard: DashboardDto | null = null;
  try {
    dashboard = await getDashboard(actor);
  } catch (error) {
    console.error('dashboard failed to load', error);
  }

  return (
    <DashboardOverviewView adminName={actor.name} renderedAt={renderedAt} siteUrl={siteUrl} dashboard={dashboard} />
  );
}
