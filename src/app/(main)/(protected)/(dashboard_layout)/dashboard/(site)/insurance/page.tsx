import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { GlobalEditor } from '@/features/globals/components/global-editor';

export const metadata: Metadata = {
  title: 'Insurance page',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be prerendered.
export const instant = false;

export default async function InsurancePageContentPage() {
  await requirePermission(permissionFor('/dashboard/insurance'));
  return <GlobalEditor title='Insurance page' keys={['page.insurance']} />;
}
