import { TablePageSkeleton } from '@/components/layout/page-skeleton';

// Dashboard pages render per request (session cookie + database reads), so without this the
// old page just freezes until the server responds. Instant skeleton on every navigation
// inside the dashboard shell — sidebar and header stay mounted around it.
export default function DashboardLoading() {
  return <TablePageSkeleton />;
}
