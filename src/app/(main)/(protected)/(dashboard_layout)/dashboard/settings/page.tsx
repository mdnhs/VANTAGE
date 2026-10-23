import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { noAccessHref } from '@/lib/admin/no-access';
import { visibleNav } from '@/lib/admin/nav';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Site settings',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie per request — must not be prerendered.
export const instant = false;

// The first settings page this role may open (the registry gates each child),
// so settings.read-only pages are never offered to a globals.read-only role.
export default async function SettingsIndexPage() {
  const actor = await requirePermission(permissionFor('/dashboard/settings'), '/dashboard/settings');
  const first = visibleNav(actor.roles).find((item) => item.id === 'settings')?.children?.[0];
  redirect(first ? first.href : noAccessHref('/dashboard/settings'));
}
