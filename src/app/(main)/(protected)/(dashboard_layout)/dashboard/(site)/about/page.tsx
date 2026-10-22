import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { GlobalEditor } from '@/features/globals/components/global-editor';

export const metadata: Metadata = {
  title: 'About page',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be prerendered.
export const instant = false;

export default async function AboutPageContentPage() {
  await requirePermission(permissionFor('/dashboard/about'));
  return <GlobalEditor title='About page' keys={['page.about']} />;
}
