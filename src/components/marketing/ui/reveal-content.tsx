import type { ReactNode } from 'react';

// Goes inside a `relative overflow-hidden` button marked `data-reveal-button`; ButtonRevealLayer
// animates it. `band` is the colour of the pass: dark on red buttons, red on everything else.
export function RevealContent({
  band = 'brand',
  className = '',
  children,
}: {
  band?: 'brand' | 'dark';
  className?: string;
  children: ReactNode;
}) {
  return (
    <>
      <span
        data-reveal-band
        aria-hidden
        className={`pointer-events-none absolute inset-0 opacity-0 ${band === 'dark' ? 'bg-[#20252d]' : 'bg-brand'}`}
      />
      <span className='relative block min-w-0 overflow-hidden'>
        <span data-reveal-rise className={`flex items-center justify-center ${className}`}>
          {children}
        </span>
      </span>
    </>
  );
}
