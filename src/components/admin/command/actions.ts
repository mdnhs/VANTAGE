import { matchesSearch } from '@/lib/search/normalize';
import { switchTheme } from '@/lib/theme/switch-theme';

// Client-side actions in ⌘K. Navigation comes from the search API, so the
// server decides what each role may reach.
export type PaletteAction = {
  id: string;
  label: string;
  keywords: readonly string[];
  run: () => void;
};

export function matchesQuery(q: string, label: string, keywords: readonly string[]) {
  return matchesSearch(q, [label, ...keywords]);
}

export function buildActions({
  setTheme,
  signOut,
  siteUrl,
}: {
  setTheme: (theme: string) => void;
  signOut: () => void;
  siteUrl: string;
}): PaletteAction[] {
  return [
    {
      id: 'theme-light',
      label: 'Switch to light theme',
      keywords: ['appearance', 'mode', 'light'],
      run: () => switchTheme(setTheme, 'light'),
    },
    {
      id: 'theme-dark',
      label: 'Switch to dark theme',
      keywords: ['appearance', 'mode', 'night'],
      run: () => switchTheme(setTheme, 'dark'),
    },
    {
      id: 'open-site',
      label: 'Open the live site',
      keywords: ['website', 'view', 'public'],
      run: () => window.open(siteUrl, '_blank', 'noopener,noreferrer'),
    },
    { id: 'sign-out', label: 'Sign out', keywords: ['log out', 'logout', 'exit'], run: signOut },
  ];
}
