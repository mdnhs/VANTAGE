import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/admin/dashboard/page-header';
import { comingSoonParams, guardComingSoon } from '@/lib/admin/coming-soon';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { requireActor, requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Coming soon',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

type Params = { section: string; rest?: string[] };

// One prerendered route per registered placeholder path (see comingSoonParams).
// The page still authenticates per request through the layout and the guards.
export function generateStaticParams() {
  return comingSoonParams();
}

// Every sidebar destination a later phase has not built yet lands here. A real
// route folder takes precedence over this dynamic one as soon as it exists.
export default async function SectionPage({ params }: { params: Promise<Params> }) {
  const { section, rest = [] } = await params;
  const link = await guardComingSoon(section, rest, { requireActor, requirePermission, notFound });
  return (
    <section className='flex flex-col items-start gap-4'>
      <PageHeader title={link.label} />
      <p className='max-w-prose text-sm text-muted-foreground'>
        This part of the admin arrives in a later release. Everything you can see in the menu is already set up for your
        role.
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
