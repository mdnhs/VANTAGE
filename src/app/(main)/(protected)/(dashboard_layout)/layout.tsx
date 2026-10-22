import './admin.css';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { AdminShell } from '@/components/admin/shell/admin-shell';
import { SIDEBAR_COOKIE } from '@/components/admin/shell/constants';
import { Toaster } from '@/components/ui/sonner';
import { ActorProvider } from '@/contexts/actor-provider';
import { AdminThemeStyle } from '@/features/appearance/components/admin-theme-style';
import { DefaultMode } from '@/features/appearance/components/default-mode';
import { ViewAsBanner } from '@/features/users/components/view-as-banner';
import { toMePayload } from '@/lib/auth/me';
import { requireActor } from '@/server/lib/auth/session';
import { getPublishedTheme } from '@/server/queries/get-theme';
import { siteSettingsService } from '@/server/services/site-settings-service';

// Every route under this layout reads the session cookie per request (auth check +
// permission-filtered nav) — inherently dynamic, so it must not be prerendered.
export const instant = false;

// Real auth check for the dashboard shell — proxy.ts only checks cookie presence, this reads
// the database-checked Better Auth session and redirects (to /login) when it is missing,
// expired, or belongs to a site customer (role "user").
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const [actor, settings, cookieStore, theme] = await Promise.all([
    requireActor(),
    siteSettingsService.getPublic(),
    cookies(),
    getPublishedTheme(),
  ]);
  // Only an explicit "false" collapses; a first visit starts open.
  const sidebarOpen = cookieStore.get(SIDEBAR_COOKIE)?.value !== 'false';
  const brand = {
    name: settings.businessName?.trim() || 'Vantage',
    logoPublicId: 'logoPublicId' in settings ? settings.logoPublicId : null,
    logoLottieJson: 'logoLottieJson' in settings ? (settings.logoLottieJson ?? null) : null,
    logoUseLottie: 'logoUseLottie' in settings ? Boolean(settings.logoUseLottie) : false,
  };
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return (
    <div data-admin-root className='font-sans'>
      <AdminThemeStyle theme={theme} />
      <DefaultMode mode={theme.admin.mode} />
      <ActorProvider actor={toMePayload(actor)}>
        <AdminShell defaultOpen={sidebarOpen} siteUrl={siteUrl} brand={brand}>
          {children}
        </AdminShell>
        <ViewAsBanner />
      </ActorProvider>
      <Toaster position='top-center' />
    </div>
  );
}
