import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/admin/dashboard/page-header';
import { PageSeoTab } from '@/features/seo/components/page-seo-tab';
import { permissionFor } from '@/lib/admin/route-permissions';
import { isPublicPageId, PUBLIC_PAGES } from '@/lib/seo/public-pages';
import { requireActor, requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Page SEO',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

// SEO for a public page that has no editor of its own (Contact, Get a quote); works for all eight.
export default async function PageSeoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const path = `/dashboard/seo/pages/${id}`;
  await requireActor(path);
  await requirePermission(permissionFor(path), path);
  if (!isPublicPageId(id)) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title={`${PUBLIC_PAGES[id].label} · SEO`} description='Changes go live as soon as you save.' />
      <PageSeoTab id={id} />
    </div>
  );
}
