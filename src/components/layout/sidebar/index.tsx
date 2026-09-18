import Link from 'next/link';
import { LayoutDashboard, Wrench, FolderKanban, Home, Settings, Users } from 'lucide-react';
import { PERMISSIONS, type PermissionValue } from '@/lib/permission/permissions';
import { getSession } from '@/lib/permission/server-utils';
import { createPermissionChecker } from '@/lib/permission/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavUser } from '@/components/layout/sidebar/nav-user';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  permissions: PermissionValue[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: APP_ROUTES.dashboard.index, icon: LayoutDashboard, permissions: [] },
  {
    label: 'Services',
    href: APP_ROUTES.content.services.index,
    icon: Wrench,
    permissions: [PERMISSIONS.SERVICES_MANAGE],
  },
  {
    label: 'Projects',
    href: APP_ROUTES.content.projects.index,
    icon: FolderKanban,
    permissions: [PERMISSIONS.PROJECTS_MANAGE],
  },
  {
    label: 'Home page',
    href: APP_ROUTES.content.homePage.index,
    icon: Home,
    permissions: [
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.PILLARS_MANAGE,
      PERMISSIONS.CATALOG_MANAGE,
      PERMISSIONS.PROCESS_MANAGE,
      PERMISSIONS.TESTIMONIALS_MANAGE,
      PERMISSIONS.LOGOS_MANAGE,
    ],
  },
  {
    label: 'Site settings',
    href: APP_ROUTES.content.settings.index,
    icon: Settings,
    permissions: [PERMISSIONS.SETTINGS_MANAGE],
  },
  { label: 'Admins', href: APP_ROUTES.content.admins.index, icon: Users, permissions: [PERMISSIONS.ADMINS_MANAGE] },
];

// Server-rendered so nav items are filtered by permission before the HTML ever reaches the
// client — no flash of links the viewer can't use. Renders the shadcn Sidebar primitives
// (collapsible-to-icon, tooltip-on-collapse) but keeps all the real auth/permission logic —
// this is composed as a child of the client `SidebarProvider` from the dashboard layout, so
// the permission check here still runs entirely on the server.
export async function Sidebar() {
  const session = await getSession();
  const checker = session ? createPermissionChecker(session.permissions) : null;

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.permissions.length === 0 || checker?.hasAnyPermissionByValues(item.permissions),
  );

  return (
    <SidebarPrimitive collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href={APP_ROUTES.dashboard.index} className='flex items-center gap-2 rounded-md p-2'>
              <div className='flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                <LayoutDashboard className='size-4' />
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'>
                <span className='truncate font-semibold'>Vantage Admin</span>
                <span className='truncate text-xs text-sidebar-foreground/70'>Content CMS</span>
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarMenu>
            {visibleItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton tooltip={item.label} render={<Link href={item.href} />}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{session && <NavUser user={{ name: session.name, email: session.email }} />}</SidebarFooter>
      <SidebarRail />
    </SidebarPrimitive>
  );
}
