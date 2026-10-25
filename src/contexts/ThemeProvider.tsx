'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes';

// next-themes injects an inline <script> to set the theme before paint. It only needs to run from
// the server HTML; when React creates it on the client it warns "Encountered a script tag...".
// A non-JS type on the client marks it as a data block, which React skips (the script already
// carries suppressHydrationWarning, so the attribute difference is not a hydration error).
const scriptProps = typeof window === 'undefined' ? undefined : { type: 'application/json' };

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider scriptProps={scriptProps} {...props}>
      {children}
    </NextThemesProvider>
  );
}
