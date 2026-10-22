import type { Metadata } from 'next';
import { requirePermission } from '@/server/lib/auth/session';
import { permissionFor } from '@/lib/admin/route-permissions';
import { CreateTestimonialForm } from '@/features/testimonials/components/create';

export const metadata: Metadata = {
  title: 'Add testimonial',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via requirePermission) per request — must not be
// prerendered.
export const instant = false;

export default async function CreateTestimonialPage() {
  await requirePermission(permissionFor('/dashboard/testimonials/create'));
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-xl font-semibold'>Add testimonial</h1>
        <p className='text-sm text-muted-foreground'>Create a new customer review for the public site.</p>
      </div>
      <CreateTestimonialForm />
    </div>
  );
}
