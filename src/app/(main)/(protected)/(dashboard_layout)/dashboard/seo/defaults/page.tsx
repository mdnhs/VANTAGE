import type { Metadata } from 'next';

import { CrawlPreview } from '@/features/seo/components/crawl-preview';
import { GlobalEditor } from '@/features/globals/components/global-editor';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requireActor, requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'SEO defaults',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

// The `seo` global: site-wide title template, description and share image, plus what crawlers
// actually receive from them.
export default async function SeoDefaultsPage() {
  const path = '/dashboard/seo/defaults';
  await requireActor(path);
  await requirePermission(permissionFor(path), path);
  return (
    <div className='flex flex-col gap-8'>
      <GlobalEditor title='SEO defaults' keys={['seo']} />
      <CrawlPreview />
    </div>
  );
}
