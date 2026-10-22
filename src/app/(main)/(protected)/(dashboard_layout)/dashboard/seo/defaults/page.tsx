import type { Metadata } from 'next';

import { GlobalEditor } from '@/features/globals/components/global-editor';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requireActor, requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'SEO defaults',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

// The `seo` global: site-wide title template, description and share image.
// Phase 6 extends this page with the rest of SEO.
export default async function SeoDefaultsPage() {
  const path = '/dashboard/seo/defaults';
  await requireActor(path);
  await requirePermission(permissionFor(path), path);
  return <GlobalEditor title='SEO defaults' keys={['seo']} />;
}
