import type { Metadata } from 'next';

import { AppearanceView } from '@/features/appearance/components/appearance-view';
import { requirePermission } from '@/server/lib/auth/session';

export const metadata: Metadata = {
  title: 'Appearance',
  robots: { index: false, follow: false, nocache: true },
};

// Reads the session cookie per request — must not be prerendered.
export const instant = false;

// Theme draft, publish and history. Reading is open to appearance.read; the
// controls and the API enforce update / publish separately.
export default async function AppearancePage() {
  await requirePermission({ appearance: ['read'] }, '/dashboard/appearance');
  return <AppearanceView />;
}
