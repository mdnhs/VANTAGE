import type { Metadata } from 'next';
import { AdminWorkspace } from '@/features/admin/components/admin-workspace';
import { parseAdminTab } from '@/features/admin/tabs';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via the layout) and ?tab per request — must not be prerendered.
export const instant = false;

// Workshop operations workspace. Records are still in-memory mock data (features/admin/mock-data)
// until the enquiries/customers backend exists.
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;

  return <AdminWorkspace activeTab={parseAdminTab(tab)} />;
}
