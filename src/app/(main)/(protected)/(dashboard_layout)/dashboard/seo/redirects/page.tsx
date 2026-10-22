import type { Metadata } from 'next';

import { RedirectsView } from '@/features/seo/components/redirects-view';
import { requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Redirects',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function RedirectsPage() {
  await requirePermission({ redirect: ['read'] }, '/dashboard/seo/redirects');
  return <RedirectsView />;
}
