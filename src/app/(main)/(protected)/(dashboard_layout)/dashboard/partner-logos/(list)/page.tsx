import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { partnerLogoService } from '@/server/services/partner-logo-service';
import { PartnerLogoTable } from '@/features/partner-logos/components/list/partner-logo-table';

export const metadata: Metadata = {
  title: 'Partner logos',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via PermissionGate) per request — must not be prerendered.
export const instant = false;

export default async function PartnerLogosListPage() {
  const { rows, total } = await partnerLogoService.listAdmin({ page: 1, limit: 50 });

  return (
    <PermissionGate permissions={[PERMISSIONS.LOGOS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-xl font-semibold'>Partner Logos</h1>
            <p className='text-sm text-muted-foreground'>
              Insurance and partner company logos shown on the homepage and insurance page, in display order.
            </p>
          </div>
          <Link href={APP_ROUTES.content.partnerLogos.create} className={cn(buttonVariants())}>
            Add logo
          </Link>
        </div>
        <PartnerLogoTable initialData={{ data: rows, total }} />
      </div>
    </PermissionGate>
  );
}
