import type { Metadata } from 'next';

import { ConsentView } from '@/features/marketing/components/consent-view';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requireActor, requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Consent banner',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function ConsentPage() {
  const path = '/dashboard/marketing/consent';
  await requireActor(path);
  await requirePermission(permissionFor(path), path);
  return <ConsentView />;
}
