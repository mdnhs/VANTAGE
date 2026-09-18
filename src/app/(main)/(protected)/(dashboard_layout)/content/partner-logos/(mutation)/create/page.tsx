import type { Metadata } from 'next';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { CreatePartnerLogoForm } from '@/features/partner-logos/components/create';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function CreatePartnerLogoPage() {
  return (
    <PermissionGate permissions={[PERMISSIONS.LOGOS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Add partner logo</h1>
          <p className='text-sm text-muted-foreground'>Add a new insurance or partner company logo.</p>
        </div>
        <CreatePartnerLogoForm />
      </div>
    </PermissionGate>
  );
}
