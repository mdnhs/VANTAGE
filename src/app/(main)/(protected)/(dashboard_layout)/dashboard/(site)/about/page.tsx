import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/dashboard/page-header';
import { PageTabs } from '@/components/layout/page-tabs';
import { GlobalEditor } from '@/features/globals/components/global-editor';
import { seoTab } from '@/features/seo/components/seo-tab';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'About page',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be prerendered.
export const instant = false;

export default async function AboutPageContentPage() {
  const actor = await requirePermission(permissionFor('/dashboard/about'));
  const seo = seoTab(actor, 'about');
  if (seo.length === 0) return <GlobalEditor title='About page' keys={['page.about']} />;

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='About page'
        description='Page copy (changes go live as soon as you save), plus how the page appears in search results and when shared.'
      />
      <PageTabs
        tabs={[
          {
            value: 'content',
            label: 'Page copy',
            content: <GlobalEditor title='About page' keys={['page.about']} embedded />,
          },
          ...seo,
        ]}
      />
    </div>
  );
}
