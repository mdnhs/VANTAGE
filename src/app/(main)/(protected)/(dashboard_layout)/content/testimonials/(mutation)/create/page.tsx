import type { Metadata } from 'next';
import { PermissionGate } from '@/lib/permission/permission-gate';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { CreateTestimonialForm } from '@/features/testimonials/components/create';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function CreateTestimonialPage() {
  return (
    <PermissionGate
      permissions={[PERMISSIONS.TESTIMONIALS_MANAGE]}
      fallback={<p>You do not have access to this page.</p>}
    >
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-xl font-semibold'>Add testimonial</h1>
          <p className='text-sm text-muted-foreground'>Create a new customer review for the public site.</p>
        </div>
        <CreateTestimonialForm />
      </div>
    </PermissionGate>
  );
}
