import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { MediaView } from '@/features/media/components/media-view';

export const metadata: Metadata = {
  title: 'Media',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function MediaPage() {
  await requirePermission(permissionFor('/dashboard/media'));
  return <MediaView />;
}
