import { linkForPath, type NavLink } from './nav';

// A sidebar destination whose page has not been built yet. Only registered
// paths resolve; anything else is a 404.
export function comingSoonLink(section: string, rest: readonly string[] = []): NavLink | undefined {
  return linkForPath(['/dashboard', section, ...rest].join('/'));
}
