import type { ReactNode } from 'react';

// Title block shared by the sign-in, forgot and reset screens.
export function AuthHeader({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <header className='flex flex-col gap-2'>
      <h1 className='text-[2rem] leading-tight font-semibold tracking-tight sm:text-4xl'>{title}</h1>
      {description && <p className='text-sm leading-relaxed text-muted-foreground'>{description}</p>}
    </header>
  );
}
