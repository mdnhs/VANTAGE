import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/dashboard/page-header';
import { PageTabs } from '@/components/layout/page-tabs';
import { GlobalEditor } from '@/features/globals/components/global-editor';
import { seoTab } from '@/features/seo/components/seo-tab';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Insurance page',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be prerendered.
export const instant = false;

export default async function InsurancePageContentPage() {
  const actor = await requirePermission(permissionFor('/dashboard/insurance'));
  const seo = seoTab(actor, 'insurance');
  if (seo.length === 0) return <GlobalEditor title='Insurance page' keys={['page.insurance']} />;

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Insurance page'
        description='Hero, steps and disclaimer copy (edits show in a live preview and go live when you publish), plus how the page appears in search results and when shared.'
      />
      <PageTabs
        tabs={[
          {
            value: 'content',
            label: 'Page text',
            content: <GlobalEditor title='Insurance page' keys={['page.insurance']} embedded />,
          },
          ...seo,
        ]}
      />
    </div>
  );
}
