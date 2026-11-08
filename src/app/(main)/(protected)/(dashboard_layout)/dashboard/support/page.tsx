import type { Metadata } from 'next';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requirePermission } from '@/server/lib/auth/session';
import { SupportInboxView } from '@/features/support/components/inbox/support-inbox-view';

export const metadata: Metadata = {
  title: 'Live chat',
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ c?: string | string[] }> }) {
  await requirePermission(permissionFor('/dashboard/support'));
  const { c } = await searchParams;
  return <SupportInboxView initialId={typeof c === 'string' ? c : null} />;
}
