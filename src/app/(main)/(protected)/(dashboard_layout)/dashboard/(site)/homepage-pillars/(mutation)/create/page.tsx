import type { Metadata } from 'next';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { CreateHomepagePillarForm } from '@/features/homepage-pillars/components/create';

export const metadata: Metadata = {
  title: 'Add homepage pillar',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via PermissionGate/getSession) per request — must not be
// prerendered.
export const instant = false;

export default function CreateHomepagePillarPage() {
  return (
    <PermissionGate permissions={[PERMISSIONS.PILLARS_MANAGE]} fallback={<p>You do not have access to this page.</p>}>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Add homepage pillar</h1>
          <p className='text-sm text-muted-foreground'>Add a new feature-pillar card shown on the homepage.</p>
        </div>
        <CreateHomepagePillarForm />
      </div>
    </PermissionGate>
  );
}
