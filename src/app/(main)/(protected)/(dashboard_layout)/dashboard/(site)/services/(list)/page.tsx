import { HideForAuthorOnly } from '@/components/admin/author-gate';
import { LINK_PRIMARY, PageHeader } from '@/components/admin/dashboard/page-header';
import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import Link from 'next/link';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { PageTabs } from '@/components/layout/page-tabs';
import { GlobalEditor } from '@/features/globals/components/global-editor';
import { serviceService } from '@/server/services/service-service';
import { seoTab } from '@/features/seo/components/seo-tab';
import { ServiceTable } from '@/features/services/components/list/service-table';

export const metadata: Metadata = {
  title: 'Services',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be prerendered.
export const instant = false;

export default async function ServicesListPage() {
  const actor = await requirePermission(permissionFor('/dashboard/services'));
  const { rows, total } = await serviceService.listAdmin({ page: 1, limit: 50 });

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Services page'
        description='Hero copy (changes go live as soon as you save) and the service blocks shown on the public services page.'
        actions={
          <HideForAuthorOnly>
            <Link href={APP_ROUTES.content.services.create} className={LINK_PRIMARY}>
              Add service
            </Link>
          </HideForAuthorOnly>
        }
      />
      <PageTabs
        tabs={[
          {
            value: 'hero',
            label: 'Hero',
            content: <GlobalEditor title='Services page' keys={['page.services']} embedded />,
          },
          {
            value: 'services',
            label: 'Services',
            content: (
              <>
                <div className='flex items-center justify-between'>
                  <p className='text-sm text-muted-foreground'>Displayed in this order on the services page.</p>
                </div>
                <ServiceTable initialData={{ data: rows, total }} />
              </>
            ),
          },
          ...seoTab(actor, 'services'),
        ]}
      />
    </div>
  );
}
