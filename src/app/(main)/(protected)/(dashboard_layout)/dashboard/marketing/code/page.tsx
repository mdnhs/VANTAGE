import type { Metadata } from 'next';

import { CodeView } from '@/features/marketing/components/code-view';
import { serverEnv } from '@/lib/env';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requireActor, requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Custom code',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function CodePage() {
  const path = '/dashboard/marketing/code';
  await requireActor(path);
  await requirePermission(permissionFor(path), path);
  // Read per request, after the auth checks have made this page dynamic.
  return <CodeView disabled={serverEnv().DISABLE_CUSTOM_SCRIPTS === true} />;
}
