import type { Metadata } from 'next';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { AboutPageForm } from '@/features/about-page/components/about-page-form';
import { resolveAboutContent } from '@/features/about-page/defaults';

export const metadata: Metadata = {
  title: 'About page',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via PermissionGate) per request — must not be prerendered.
export const instant = false;

export default async function AboutPageContentPage() {
  const settings = await siteSettingsService.getAdmin();

  return (
    <PermissionGate permissions={[PERMISSIONS.SETTINGS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>About page</h1>
          <p className='text-sm text-muted-foreground'>
            Hero, heritage story, team members and standards shown on the public about page. Empty image slots show the
            bundled photo.
          </p>
        </div>
        <AboutPageForm initialContent={resolveAboutContent(settings)} />
      </div>
    </PermissionGate>
  );
}
