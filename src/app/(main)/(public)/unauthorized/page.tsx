import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unauthorized',
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return (
    <div className='flex min-h-screen flex-1 items-center justify-center'>
      <h1 className='text-2xl font-semibold'>You are not authorized to view this page.</h1>
    </div>
  );
}
