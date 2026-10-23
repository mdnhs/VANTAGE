import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GlobalEditor } from '@/features/globals/components/global-editor';
import { NotificationsTestEmail } from '@/features/globals/components/notifications-test-email';
import { linkForPath } from '@/lib/admin/nav';
import { SETTINGS_PAGES, SETTINGS_PAGE_LABELS, type SettingsPage } from '@/lib/content/global-access';
import { requireActor, requirePermission } from '@/server/lib/auth/session';

export const instant = false;

type Params = { slug: string };

const isSettingsPage = (slug: string): slug is SettingsPage => Object.hasOwn(SETTINGS_PAGES, slug);

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: isSettingsPage(slug) ? SETTINGS_PAGE_LABELS[slug] : 'Site settings',
    robots: { index: false, follow: false, nocache: true },
  };
}

// One page per registry child: signed in first (a 404 never tells a stranger
// which slugs exist), then the child's own permission. The editor itself
// reads the document through the globals API, which authorises again.
export default async function SettingsSlugPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const path = `/dashboard/settings/${slug}`;
  await requireActor(path);
  const link = linkForPath(path);
  if (!link || !isSettingsPage(slug)) notFound();
  await requirePermission(link.permission, path);
  return (
    <>
      <GlobalEditor title={link.label} keys={SETTINGS_PAGES[slug]} />
      {slug === 'notifications' ? <NotificationsTestEmail /> : null}
    </>
  );
}
