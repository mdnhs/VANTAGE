import type { Metadata } from 'next';
import { getSession } from '@/lib/permission/server-utils';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie (via the layout) per request — must not be prerendered.
export const instant = false;

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className='flex flex-col gap-2'>
      <h1 className='text-xl font-semibold'>Welcome{session ? `, ${session.name}` : ''}</h1>
      <p className='text-sm text-muted-foreground'>Pick a section from the sidebar to manage site content.</p>
    </div>
  );
}
