import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/dashboard/page-header';
import { PageTabs } from '@/components/layout/page-tabs';
import { GlobalEditor } from '@/features/globals/components/global-editor';
import { seoTab } from '@/features/seo/components/seo-tab';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Contact page',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be prerendered.
export const instant = false;

export default async function ContactPageContentPage() {
  const actor = await requirePermission(permissionFor('/dashboard/contact-page'));
  const seo = seoTab(actor, 'contact');
  if (seo.length === 0) return <GlobalEditor title='Contact page' keys={['page.contact']} />;

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Contact page'
        description='Banner copy and background (edits show in a live preview and go live when you publish), plus how the page appears in search results and when shared. Phone, email and address are under Settings > Contact.'
      />
      <PageTabs
        tabs={[
          {
            value: 'content',
            label: 'Page text',
            content: <GlobalEditor title='Contact page' keys={['page.contact']} embedded />,
          },
          ...seo,
        ]}
      />
    </div>
  );
}
