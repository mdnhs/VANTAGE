import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { serviceService } from '@/server/services/service-service';
import { ServiceTable } from '@/features/services/components/list/service-table';

export const metadata: Metadata = {
  title: 'Services',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via PermissionGate) per request — must not be prerendered.
export const instant = false;

export default async function ServicesListPage() {
  const { rows, total } = await serviceService.listAdmin({ page: 1, limit: 50 });

  return (
    <PermissionGate permissions={[PERMISSIONS.SERVICES_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-xl font-semibold'>Services</h1>
            <p className='text-sm text-muted-foreground'>
              Services shown on the homepage and services page, in display order.
            </p>
          </div>
          <Link href={APP_ROUTES.content.services.create} className={cn(buttonVariants())}>
            Add service
          </Link>
        </div>
        <ServiceTable initialData={{ data: rows, total }} />
      </div>
    </PermissionGate>
  );
}
