import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { SectionTabs } from '@/components/layout/section-tabs';
import { ProcessPanel } from '@/features/home-page/components/sections/process-panel';
import { homepageProcessStepService } from '@/server/services/homepage-process-step-service';
import { ProcessPageForm } from '@/features/process-page/components/process-page-form';
import { resolveProcessPageContent } from '@/features/process-page/defaults';

export const metadata: Metadata = {
  title: 'Process page',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be prerendered.
export const instant = false;

export default async function ProcessPageContentPage() {
  await requirePermission(permissionFor('/dashboard/process-page'));
  const [settings, steps] = await Promise.all([
    siteSettingsService.getAdmin(),
    homepageProcessStepService.listAdmin({ page: 1, limit: 50 }),
  ]);

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-xl font-semibold'>Process page</h1>
        <p className='text-sm text-muted-foreground'>
          Header copy and steps shown on the public process page. The steps are shared with the homepage.
        </p>
      </div>
      <SectionTabs
        tabs={[
          {
            value: 'header',
            label: 'Header',
            content: <ProcessPageForm initialContent={resolveProcessPageContent(settings)} />,
          },
          {
            value: 'steps',
            label: 'Steps',
            content: <ProcessPanel initialData={{ data: steps.rows, total: steps.total }} />,
          },
        ]}
      />
    </div>
  );
}
