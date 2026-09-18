import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { partnerLogoService } from '@/server/services/partner-logo-service';
import { EditPartnerLogoForm } from '@/features/partner-logos/components/edit';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

interface EditPartnerLogoPageProps {
  params: Promise<{ id: string }>;
}

// Detail page: calls the service directly rather than fetching the API route.
export default async function EditPartnerLogoPage({ params }: EditPartnerLogoPageProps) {
  const { id } = await params;
  const partnerLogo = await partnerLogoService.byId(id);
  if (!partnerLogo) notFound();

  return (
    <PermissionGate permissions={[PERMISSIONS.LOGOS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Edit partner logo</h1>
          <p className='text-sm text-muted-foreground'>{partnerLogo.companyName}</p>
        </div>
        <EditPartnerLogoForm partnerLogo={partnerLogo} />
      </div>
    </PermissionGate>
  );
}
