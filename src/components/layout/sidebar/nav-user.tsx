'use client';

import { useRouter } from 'next/navigation';
import { ChevronsUpDownIcon, LogOutIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { APP_ROUTES } from '@/lib/routes/app-routes';

interface NavUserProps {
  user: {
    name: string;
    email: string;
  };
}

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        router.push(APP_ROUTES.auth.login);
        router.refresh();
      },
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size='lg' className='aria-expanded:bg-muted' />}>
            <Avatar>
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-medium'>{user.name}</span>
              <span className='truncate text-xs'>{user.email}</span>
            </div>
            <ChevronsUpDownIcon className='ml-auto size-4' />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-fit min-w-56'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                  <Avatar>
                    <AvatarFallback>{initials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-medium'>{user.name}</span>
                    <span className='truncate text-xs'>{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={logout.isPending}>
              <LogOutIcon />
              {logout.isPending ? 'Logging out…' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
