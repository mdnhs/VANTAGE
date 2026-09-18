import type { Metadata } from 'next';
import Link from 'next/link';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { ProcessPageForm } from '@/features/process-page/components/process-page-form';
import { resolveProcessPageContent } from '@/features/process-page/defaults';

export const metadata: Metadata = {
  title: 'Process page',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via PermissionGate) per request — must not be prerendered.
export const instant = false;

export default async function ProcessPageContentPage() {
  const settings = await siteSettingsService.getAdmin();

  return (
    <PermissionGate
      permissions={[PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.PROCESS_MANAGE]}
      fallback={<p>You do not have access to this page.</p>}
    >
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Process page</h1>
          <p className='text-sm text-muted-foreground'>
            Header copy for the public process page. The steps themselves are shared with the homepage and managed under{' '}
            <Link href={APP_ROUTES.content.homepageProcessSteps.index} className='underline'>
              Home page → Process
            </Link>
            .
          </p>
        </div>
        <ProcessPageForm initialContent={resolveProcessPageContent(settings)} />
      </div>
    </PermissionGate>
  );
}
