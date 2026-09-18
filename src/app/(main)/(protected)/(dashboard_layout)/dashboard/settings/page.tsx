import type { Metadata } from 'next';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { SettingsTabs } from '@/features/site-settings/components/settings-tabs';

export const metadata: Metadata = {
  title: 'Site settings',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via PermissionGate) per request — must not be prerendered.
export const instant = false;

// Detail page: calls the service directly rather than fetching the API route.
export default async function SiteSettingsPage() {
  const initialData = await siteSettingsService.getAdmin();

  return (
    <PermissionGate permissions={[PERMISSIONS.SETTINGS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Site settings</h1>
          <p className='text-sm text-muted-foreground'>
            Business contact info, social links and hero media shown across the public site.
          </p>
        </div>
        <SettingsTabs initialData={initialData ?? null} />
      </div>
    </PermissionGate>
  );
}
