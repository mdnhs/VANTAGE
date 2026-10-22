'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowUpRightIcon, SparklesIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useMemo, useState } from 'react';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useActor } from '@/contexts/actor-provider';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useSignOut } from '@/features/auth/hooks/use-sign-out';

import { buildActions, matchesQuery } from './actions';
import { useCommandPalette } from './palette-context';

type SearchHit = { id: string; kind: 'page'; label: string; href: string };

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}`;

async function fetchSearch(q: string): Promise<SearchHit[]> {
  const res = await fetch(`${BASE_URL}/admin/search?q=${encodeURIComponent(q)}`);
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Search failed');
  return body.data.items as SearchHit[];
}

export function CommandPalette({ siteUrl }: { siteUrl: string }) {
  const { open, setOpen } = useCommandPalette();
  const [q, setQ] = useState('');
  const term = useDebouncedValue(q, 150);
  const { user } = useActor();
  const router = useRouter();
  const { setTheme } = useTheme();
  const { signOut } = useSignOut();
  const { data, isError } = useQuery({
    queryKey: ['admin-search', user.id, term],
    queryFn: () => fetchSearch(term),
    enabled: open,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const actions = useMemo(
    () =>
      buildActions({ setTheme, signOut, siteUrl }).filter((action) => matchesQuery(q, action.label, action.keywords)),
    [q, setTheme, signOut, siteUrl],
  );

  // One close path: Escape, a selection, the overlay and ⌘K all land here.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setQ('');
  }

  const close = () => setOpen(false);

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      title='Search the admin'
      description='Jump to a page or run an action'
      className='sm:max-w-xl'
    >
      {/* The server already filtered navigation by role and query. */}
      <Command shouldFilter={false} loop>
        <CommandInput placeholder='Search pages and actions…' value={q} onValueChange={setQ} />
        <CommandList>
          <CommandEmpty>
            {isError
              ? 'Search is unavailable right now. Try again in a moment.'
              : data
                ? `Nothing matches “${q}”.`
                : 'Searching…'}
          </CommandEmpty>
          {data?.length ? (
            <CommandGroup heading='Go to'>
              {data.map((hit) => (
                <CommandItem
                  key={hit.id}
                  value={hit.id}
                  onSelect={() => {
                    close();
                    router.push(hit.href);
                  }}
                >
                  <ArrowUpRightIcon aria-hidden />
                  {hit.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {actions.length ? (
            <CommandGroup heading='Actions'>
              {actions.map((action) => (
                <CommandItem
                  key={action.id}
                  value={action.id}
                  onSelect={() => {
                    close();
                    action.run();
                  }}
                >
                  <SparklesIcon aria-hidden />
                  {action.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
