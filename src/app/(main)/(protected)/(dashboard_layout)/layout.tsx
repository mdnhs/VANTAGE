import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Globe } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getSession } from '@/lib/permission/server-utils';
import { PermissionsProvider } from '@/lib/permission/permissions-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { inter } from '@/lib/font';

// Every route under this layout reads the session cookie per request (auth check +
// permission-filtered nav) — inherently dynamic, so it must not be prerendered.
export const instant = false;

// Real auth/permission check for the dashboard shell — proxy.ts only checks cookie
// presence, this verifies the JWT and redirects on an expired/invalid/missing session.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect(APP_ROUTES.auth.login);

  return (
    <PermissionsProvider permissions={session.permissions}>
      <SidebarProvider className={`${inter.variable} font-(family-name:--font-inter)`}>
        <Sidebar />
        <SidebarInset className='h-svh overflow-y-auto md:peer-data-[variant=inset]:h-[calc(100svh-1rem)]'>
          <header className='sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b border-border bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60'>
            <div className='flex items-center gap-2 px-4'>
              <SidebarTrigger className='-ml-1' />
              <Separator orientation='vertical' className='mr-2 data-vertical:h-4 data-vertical:self-auto' />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <Link
              href='/'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='View live site (opens in a new tab)'
              title='View live site'
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'mr-4 ml-auto')}
            >
              <Globe className='size-4' />
            </Link>
          </header>
          <div className='flex-1 p-6'>{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </PermissionsProvider>
  );
}
