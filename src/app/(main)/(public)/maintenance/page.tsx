import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Maintenance',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className='flex min-h-screen flex-1 items-center justify-center'>
      <h1 className='text-2xl font-semibold'>We&apos;ll be back shortly.</h1>
    </div>
  );
}
