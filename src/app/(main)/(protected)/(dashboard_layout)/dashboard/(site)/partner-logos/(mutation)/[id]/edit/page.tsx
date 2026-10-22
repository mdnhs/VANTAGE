import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { notFound } from 'next/navigation';
import { partnerLogoService } from '@/server/services/partner-logo-service';
import { EditPartnerLogoForm } from '@/features/partner-logos/components/edit';

export const metadata: Metadata = {
  title: 'Edit partner logo',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

interface EditPartnerLogoPageProps {
  params: Promise<{ id: string }>;
}

// Detail page: calls the service directly rather than fetching the API route.
export default async function EditPartnerLogoPage({ params }: EditPartnerLogoPageProps) {
  await requirePermission(permissionFor('/dashboard/partner-logos/[id]/edit'));
  const { id } = await params;
  const partnerLogo = await partnerLogoService.byId(id);
  if (!partnerLogo) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-xl font-semibold'>Edit partner logo</h1>
        <p className='text-sm text-muted-foreground'>{partnerLogo.companyName}</p>
      </div>
      <EditPartnerLogoForm partnerLogo={partnerLogo} />
    </div>
  );
}
