import type { Metadata } from 'next';

import { SeoOverviewView } from '@/features/seo/components/seo-overview-view';
import { requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'SEO',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function SeoOverviewPage() {
  await requirePermission({ seo: ['read'] }, '/dashboard/seo');
  return <SeoOverviewView />;
}
