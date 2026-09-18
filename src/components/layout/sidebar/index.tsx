import Link from 'next/link';
import { LayoutDashboard, Globe, Settings, Users, ClipboardList, MessageSquare } from 'lucide-react';
import { SITE_NAV_ITEMS } from '@/components/layout/site-nav-items';
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

interface NavGroup {
  label: string;
  items: NavItem[];
}

// The six public-page editors (home, services, our work, insurance, about, process) live
// behind one "Website pages" entry — they share a left-hand page menu (see SITE_NAV_ITEMS).
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: APP_ROUTES.dashboard.index, icon: LayoutDashboard, permissions: [] }],
  },
  {
    label: 'Leads',
    items: [
      {
        label: 'Quote Requests',
        href: APP_ROUTES.leads.quotes.index,
        icon: ClipboardList,
        permissions: [PERMISSIONS.QUOTES_MANAGE],
      },
      {
        label: 'Contact Messages',
        href: APP_ROUTES.leads.contacts.index,
        icon: MessageSquare,
        permissions: [PERMISSIONS.CONTACTS_MANAGE],
      },
    ],
  },
  {
    label: 'Website',
    items: [
      // href is resolved per-viewer below to the first page they may edit.
      {
        label: 'Website pages',
        href: APP_ROUTES.content.homePage.index,
        icon: Globe,
        permissions: [...new Set(SITE_NAV_ITEMS.flatMap((item) => item.permissions))],
      },
      {
        label: 'Site settings',
        href: APP_ROUTES.content.settings.index,
        icon: Settings,
        permissions: [PERMISSIONS.SETTINGS_MANAGE],
      },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Admins', href: APP_ROUTES.content.admins.index, icon: Users, permissions: [PERMISSIONS.ADMINS_MANAGE] },
    ],
  },
];

// Server-rendered so nav items are filtered by permission before the HTML ever reaches the
// client — no flash of links the viewer can't use. Renders the shadcn Sidebar primitives
// (collapsible-to-icon, tooltip-on-collapse) but keeps all the real auth/permission logic —
// this is composed as a child of the client `SidebarProvider` from the dashboard layout, so
// the permission check here still runs entirely on the server.
export async function Sidebar() {
  const session = await getSession();
  const checker = session ? createPermissionChecker(session.permissions) : null;

  const canSee = (permissions: PermissionValue[]) =>
    permissions.length === 0 || Boolean(checker?.hasAnyPermissionByValues(permissions));
  const firstSitePage = SITE_NAV_ITEMS.find((item) => canSee(item.permissions));

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => canSee(item.permissions))
      .map((item) => (item.label === 'Website pages' && firstSitePage ? { ...item, href: firstSitePage.href } : item)),
  })).filter((group) => group.items.length > 0);

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
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton tooltip={item.label} render={<Link href={item.href} />}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>{session && <NavUser user={{ name: session.name, email: session.email }} />}</SidebarFooter>
      <SidebarRail />
    </SidebarPrimitive>
  );
}
