import type { Metadata } from 'next';
import Link from 'next/link';

import { noAccessLabel } from '@/lib/admin/no-access';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { requireActor } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'No access',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Where requirePermission sends a signed-in role that may not open a page.
export default async function NoAccessPage({ searchParams }: { searchParams: SearchParams }) {
  await requireActor();
  const { from } = await searchParams;
  const label = noAccessLabel(typeof from === 'string' ? from : null);
  return (
    <section className='mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center'>
      <h1 className='text-card-title'>You don&apos;t have access to {label ?? 'this page'}</h1>
      <p className='text-sm text-muted-foreground'>
        Your role doesn&apos;t include it. Ask an owner or admin if you need it.
      </p>
      <Link
        href={APP_ROUTES.dashboard.index}
        className='text-sm font-semibold text-primary underline-offset-4 hover:underline'
      >
        Back to the dashboard
      </Link>
    </section>
  );
}
