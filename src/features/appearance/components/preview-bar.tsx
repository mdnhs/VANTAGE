'use client';

import { usePathname } from 'next/navigation';

import { exitPreviewHref } from '../services/api';

// Shown whenever draft mode is on. Exit is a full navigation (not a client route) so the
// API clears the draft-mode cookie before the page reloads.
export function PreviewBar() {
  const pathname = usePathname();
  const href = exitPreviewHref(pathname || '/');
  return (
    <div className='fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full bg-black px-4 py-2 text-sm text-white shadow-lg ring-1 ring-white/20'>
      <span>Previewing the draft theme</span>
      <a href={href} className='font-semibold underline underline-offset-2'>
        Exit preview
      </a>
    </div>
  );
}
