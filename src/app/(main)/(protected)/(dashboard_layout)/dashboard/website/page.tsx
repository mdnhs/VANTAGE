import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { noAccessHref } from '@/lib/admin/no-access';
import { visibleNav } from '@/lib/admin/nav';
import { requireActor } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Website',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie per request — must not be prerendered.
export const instant = false;

// /dashboard/website itself has no screen: open the first page of the section this role may open.
export default async function WebsiteIndexPage() {
  const actor = await requireActor('/dashboard/website');
  const first = visibleNav(actor.roles).find((item) => item.id === 'website')?.children?.[0];
  redirect(first ? first.href : noAccessHref('/dashboard/website'));
}
