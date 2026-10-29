import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { PageTabs } from '@/components/layout/page-tabs';
import { ProcessPanel } from '@/features/home-page/components/sections/process-panel';
import { homepageProcessStepService } from '@/server/services/homepage-process-step-service';
import { seoTab } from '@/features/seo/components/seo-tab';
import { GlobalEditor } from '@/features/globals/components/global-editor';

export const metadata: Metadata = {
  title: 'Process page',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be prerendered.
export const instant = false;

export default async function ProcessPageContentPage() {
  const actor = await requirePermission(permissionFor('/dashboard/process-page'));
  const steps = await homepageProcessStepService.listAdmin({ page: 1, limit: 50 });

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Process page'
        description='Header copy (edits show in a live preview and go live when you publish) and steps shown on the public process page. The steps are shared with the homepage.'
      />
      <PageTabs
        tabs={[
          {
            value: 'header',
            label: 'Header',
            content: <GlobalEditor title='Process page' keys={['page.process']} embedded />,
          },
          {
            value: 'steps',
            label: 'Steps',
            content: <ProcessPanel initialData={{ data: steps.rows, total: steps.total }} />,
          },
          ...seoTab(actor, 'process'),
        ]}
      />
    </div>
  );
}
