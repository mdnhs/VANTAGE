import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { AboutPageForm } from '@/features/about-page/components/about-page-form';
import { resolveAboutContent } from '@/features/about-page/defaults';

export const metadata: Metadata = {
  title: 'About page',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be prerendered.
export const instant = false;

export default async function AboutPageContentPage() {
  await requirePermission(permissionFor('/dashboard/about'));
  const settings = await siteSettingsService.getAdmin();

  return (
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
  );
}
