import { describe, expect, it } from 'vitest';

import { matchesRoute } from './routes-match';

describe('matchesRoute', () => {
  it('runs everywhere when no route is given', () => {
    expect(matchesRoute([], '/anything')).toBe(true);
  });
  it('matches exact paths and prefix wildcards', () => {
    expect(matchesRoute(['/'], '/')).toBe(true);
    expect(matchesRoute(['/'], '/about')).toBe(false);
    expect(matchesRoute(['/services/*'], '/services/a-slug')).toBe(true);
    expect(matchesRoute(['/services/*'], '/services')).toBe(false);
    expect(matchesRoute(['/about', '/contact'], '/contact')).toBe(true);
  });
});
