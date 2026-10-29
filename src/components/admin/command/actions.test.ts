import { describe, expect, it, vi } from 'vitest';

import { buildActions, matchesQuery } from './actions';

const deps = () => ({ setTheme: vi.fn(), signOut: vi.fn(), siteUrl: 'https://example.com' });
const visible = (q: string) =>
  buildActions(deps())
    .filter((a) => matchesQuery(q, a.label, a.keywords))
    .map((a) => a.id);

describe('buildActions', () => {
  it('offers light and dark themes, open site and sign out', () => {
    expect(visible('')).toEqual(['theme-light', 'theme-dark', 'open-site', 'sign-out']);
  });

  it('filters by label or keyword, ignoring case and diacritics', () => {
    expect(visible('LOGOUT')).toEqual(['sign-out']);
    expect(visible('nïght')).toEqual(['theme-dark']);
    expect(visible('nothing-like-this')).toEqual([]);
  });

  it('runs each action against its dependency', () => {
    const d = deps();
    const open = vi.fn();
    vi.stubGlobal('window', { open });
    const byId = Object.fromEntries(buildActions(d).map((a) => [a.id, a]));
    byId['theme-dark']!.run();
    byId['sign-out']!.run();
    byId['open-site']!.run();
    vi.unstubAllGlobals();
    expect(d.setTheme).toHaveBeenCalledWith('dark');
    expect(d.signOut).toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
  });
});
