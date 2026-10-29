'use client';

import { LogOutIcon, MoonIcon, ShieldCheckIcon, UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useActor } from '@/contexts/actor-provider';
import { useSignOut } from '@/features/auth/hooks/use-sign-out';
import { isThemeSwitching, switchTheme } from '@/lib/theme/switch-theme';

const subscribe = () => () => {};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

// The avatar alone in the topbar; name, email and role badge sit in the
// menu it opens. The aria-label names the button, so the initials are hidden
// from assistive tech.
export function UserMenu() {
  const { user, roles } = useActor();
  const { resolvedTheme, setTheme } = useTheme();
  // resolvedTheme is unknown on the server; wait for mount so the switch never flips on hydrate.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const dark = mounted && resolvedTheme === 'dark';
  const { signOut, pending } = useSignOut();
  const roleLabel = roles.join(', ');

  return (
    // A press during the theme reveal lands on the root element; it must not close the menu.
    <DropdownMenu
      onOpenChange={(open, details) => {
        if (!open && details.reason === 'outside-press' && isThemeSwitching()) details.cancel();
      }}
    >
      <DropdownMenuTrigger
        aria-label={`Account menu for ${user.name}`}
        className='flex shrink-0 rounded-full p-1 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50'
      >
        <Avatar aria-hidden className='size-11'>
          <AvatarFallback className='bg-primary font-semibold text-primary-foreground'>
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-60'>
        <DropdownMenuGroup>
          <DropdownMenuLabel className='flex flex-col'>
            <span className='truncate font-semibold text-foreground'>{user.name}</span>
            <span className='truncate text-xs font-normal'>{user.email}</span>
            {roleLabel ? (
              <Badge variant='secondary' className='mt-2 capitalize'>
                {roleLabel}
              </Badge>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href='/dashboard/account' />}>
            <UserIcon />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href='/dashboard/account?tab=security' />}>
            <ShieldCheckIcon />
            Security
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* The menu stays open so the reveal plays behind it; the switch only mirrors the row. */}
        <DropdownMenuItem
          role='menuitemcheckbox'
          aria-checked={dark}
          closeOnClick={false}
          onClick={() => switchTheme(setTheme, dark ? 'light' : 'dark')}
        >
          <MoonIcon />
          Dark mode
          <Switch aria-hidden tabIndex={-1} checked={dark} className='pointer-events-none ml-auto' />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={pending} onClick={signOut}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
