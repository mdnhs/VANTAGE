import { PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { InsurancePageForm } from '@/features/insurance-page/components/insurance-page-form';
import { resolveInsuranceContent } from '@/features/insurance-page/defaults';

export const metadata: Metadata = {
  title: 'Insurance page',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be prerendered.
export const instant = false;

export default async function InsurancePageContentPage() {
  await requirePermission(permissionFor('/dashboard/insurance'));
  const settings = await siteSettingsService.getAdmin();

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Insurance page'
        description='Copy, feature cards and process steps shown on the public insurance page. Partner logos are managed under Home page.'
      />
      <InsurancePageForm initialContent={resolveInsuranceContent(settings)} />
    </div>
  );
}
