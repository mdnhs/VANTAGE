import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { SectionTabs } from '@/components/layout/section-tabs';
import { ServicesHeroForm } from '@/features/services/components/services-hero-form';
import { serviceService } from '@/server/services/service-service';
import { ServiceTable } from '@/features/services/components/list/service-table';

export const metadata: Metadata = {
  title: 'Services',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via PermissionGate) per request — must not be prerendered.
export const instant = false;

export default async function ServicesListPage() {
  const [{ rows, total }, settings] = await Promise.all([
    serviceService.listAdmin({ page: 1, limit: 50 }),
    siteSettingsService.getAdmin(),
  ]);

  return (
    <PermissionGate permissions={[PERMISSIONS.SERVICES_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Services page</h1>
          <p className='text-sm text-muted-foreground'>
            Hero copy and the service blocks shown on the public services page.
          </p>
        </div>
        <SectionTabs
          tabs={[
            { value: 'hero', label: 'Hero', content: <ServicesHeroForm settings={settings ?? null} /> },
            {
              value: 'services',
              label: 'Services',
              content: (
                <>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm text-muted-foreground'>Displayed in this order on the services page.</p>
                    <Link href={APP_ROUTES.content.services.create} className={cn(buttonVariants())}>
                      Add service
                    </Link>
                  </div>
                  <ServiceTable initialData={{ data: rows, total }} />
                </>
              ),
            },
          ]}
        />
      </div>
    </PermissionGate>
  );
}
