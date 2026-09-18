import type { Metadata } from 'next';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { InsurancePageForm } from '@/features/insurance-page/components/insurance-page-form';
import { resolveInsuranceContent } from '@/features/insurance-page/defaults';

export const metadata: Metadata = {
  title: 'Insurance page',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via PermissionGate) per request — must not be prerendered.
export const instant = false;

export default async function InsurancePageContentPage() {
  const settings = await siteSettingsService.getAdmin();

  return (
    <PermissionGate permissions={[PERMISSIONS.SETTINGS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Insurance page</h1>
          <p className='text-sm text-muted-foreground'>
            Copy, feature cards and process steps shown on the public insurance page. Partner logos are managed under
            Home page.
          </p>
        </div>
        <InsurancePageForm initialContent={resolveInsuranceContent(settings)} />
      </div>
    </PermissionGate>
  );
}
