import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SettingsView } from '@/features/ai/components/settings-view';
import { linkForPath } from '@/lib/admin/nav';
import { requireActor, requirePermission } from '@/server/lib/auth/session';

export const instant = false;

const PATH = '/dashboard/settings/ai-assistant';

export const metadata: Metadata = {
  title: 'AI assistant',
  robots: { index: false, follow: false, nocache: true },
};

// Signed in first, then the nav child's own permission (ai.manage). The API
// authorises again on every read and write.
export default async function AiAssistantSettingsPage() {
  await requireActor(PATH);
  const link = linkForPath(PATH);
  if (!link) notFound();
  await requirePermission(link.permission, PATH);
  return <SettingsView />;
}
