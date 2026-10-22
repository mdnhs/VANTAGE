import { SearchIcon } from 'lucide-react';

import { Kbd } from '@/components/ui/kbd';

// Stub for the command-palette trigger: looks like the real pill, does
// nothing. The palette task replaces this file.
export function SearchPill() {
  return (
    <div
      aria-disabled='true'
      data-slot='search-pill'
      className='flex h-11 w-full max-w-md items-center gap-3 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground'
    >
      <SearchIcon aria-hidden className='size-4 shrink-0' />
      <span className='flex-1 truncate text-left'>Search…</span>
      <Kbd className='hidden sm:inline-flex'>⌘K</Kbd>
    </div>
  );
}
