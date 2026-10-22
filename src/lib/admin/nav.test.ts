import { describe, expect, it } from 'vitest';

import { hasPermission, ROLE_NAMES, type RoleName } from '@/lib/auth/permissions';

import {
  activeSection,
  canOpen,
  EXTRA_LINKS,
  firstReachableHref,
  HELP_LINK,
  isActivePath,
  linkForPath,
  NAV,
  reachableLinks,
  visibleNav,
  type NavLink,
} from './nav';
import { permissionFor } from './route-permissions';

const ALL_WEBSITE = [
  'website-home',
  'website-services',
  'website-work',
  'website-insurance',
  'website-about',
  'website-process',
];

// Expected sidebar tree per role, written out from the role table.
const EXPECTED: Record<string, Record<string, string[]>> = {
  owner: {
    dashboard: [],
    website: ALL_WEBSITE,
    media: [],
    enquiries: ['enquiries-quotes', 'enquiries-contacts'],
    seo: ['seo-overview', 'seo-defaults', 'seo-redirects'],
    marketing: ['marketing-tracking', 'marketing-consent', 'marketing-events', 'marketing-code'],
    appearance: [],
    settings: [],
    users: [],
    activity: [],
  },
  admin: {
    dashboard: [],
    website: ALL_WEBSITE,
    media: [],
    enquiries: ['enquiries-quotes', 'enquiries-contacts'],
    seo: ['seo-overview', 'seo-defaults', 'seo-redirects'],
    marketing: ['marketing-tracking', 'marketing-consent', 'marketing-events'],
    appearance: [],
    settings: [],
    users: [],
    activity: [],
  },
  editor: {
    dashboard: [],
    website: ALL_WEBSITE,
    media: [],
    seo: ['seo-overview', 'seo-defaults', 'seo-redirects'],
  },
  author: { dashboard: [], website: ALL_WEBSITE, media: [] },
  marketer: {
    dashboard: [],
    website: ALL_WEBSITE,
    media: [],
    seo: ['seo-overview', 'seo-defaults', 'seo-redirects'],
    marketing: ['marketing-tracking', 'marketing-consent', 'marketing-events'],
  },
  intake: { dashboard: [], enquiries: ['enquiries-quotes', 'enquiries-contacts'] },
  viewer: { dashboard: [], website: ALL_WEBSITE, seo: ['seo-overview', 'seo-defaults'] },
  user: {},
};

const rolesOf = (name: string): RoleName[] => (name === 'user' ? [] : [name as RoleName]);

describe('visibleNav', () => {
  it('covers every role plus the non-admin user', () => {
    expect(Object.keys(EXPECTED).sort()).toEqual([...ROLE_NAMES, 'user'].sort());
  });

  it.each(Object.keys(EXPECTED))('%s sees exactly the allowed items and children', (name) => {
    const tree = Object.fromEntries(visibleNav(rolesOf(name)).map((i) => [i.id, (i.children ?? []).map((c) => c.id)]));
    expect(tree).toEqual(EXPECTED[name]);
  });

  it('merges multiple roles', () => {
    const ids = visibleNav(['intake', 'marketer']).map((i) => i.id);
    expect(ids).toContain('enquiries');
    expect(ids).toContain('marketing');
  });
});

describe('canOpen', () => {
  it('accepts any-of permissions', () => {
    const anyOf = [{ quote: ['read' as const] }, { contact: ['read' as const] }];
    expect(canOpen(['intake'], anyOf)).toBe(true);
    expect(canOpen(['marketer'], anyOf)).toBe(false);
    expect(canOpen(['intake'], { quote: ['read'] })).toBe(true);
    expect(canOpen([], anyOf)).toBe(false);
  });
});

describe('reachableLinks', () => {
  it.each(Object.keys(EXPECTED))('%s never lists a link its permission denies', (name) => {
    const roles = rolesOf(name);
    const all = [...NAV.flatMap((i) => [i, ...(i.children ?? [])]), HELP_LINK, ...EXTRA_LINKS];
    for (const dest of reachableLinks(roles)) {
      const reg = all.find((l) => l.id === dest.id);
      expect(reg, dest.id).toBeDefined();
      expect(canOpen(roles, reg!.permission), `${name} ${dest.href}`).toBe(true);
    }
  });

  it('lists each href once and labels children with their section', () => {
    const links = reachableLinks(['owner']);
    const hrefs = links.map((l) => l.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(links.find((l) => l.id === 'enquiries-quotes')?.parent).toBe('Enquiries');
    expect(links.find((l) => l.id === 'account')?.parent).toBeNull();
  });

  it('gives intake only enquiries, dashboard, help and account', () => {
    expect(reachableLinks(['intake']).map((l) => l.id)).toEqual([
      'dashboard',
      'enquiries-quotes',
      'enquiries-contacts',
      'help',
      'account',
    ]);
  });
});

describe('registry vs page guard', () => {
  const leaves: NavLink[] = [
    ...NAV.flatMap((i) => (i.children ? [...i.children] : [i as NavLink])),
    HELP_LINK,
    ...EXTRA_LINKS,
  ];

  it.each(leaves.map((l) => [l.href, l] as const))('%s resolves via permissionFor', (_href, link) => {
    expect(permissionFor(link.href)).toEqual(link.permission);
  });

  it('every parent href also resolves', () => {
    for (const item of NAV) expect(() => permissionFor(item.href)).not.toThrow();
  });

  it('permissionFor agrees with hasPermission for each leaf', () => {
    for (const link of leaves) {
      for (const name of ROLE_NAMES) {
        expect(hasPermission([name], permissionFor(link.href))).toBe(hasPermission([name], link.permission));
      }
    }
  });
});

describe('linkForPath', () => {
  it('matches exact hrefs only and prefers a child over its parent', () => {
    expect(linkForPath('/dashboard/quotes')?.id).toBe('enquiries-quotes');
    expect(linkForPath('/dashboard/seo')?.id).toBe('seo-overview');
    expect(linkForPath('/dashboard/quotes?x=1')?.id).toBe('enquiries-quotes');
    expect(linkForPath('/dashboard/quotes/123')).toBeUndefined();
    expect(linkForPath('/dashboard/help')?.id).toBe('help');
  });
});

describe('isActivePath', () => {
  const link = (id: string) => {
    const all = NAV.flatMap((i) => [i as NavLink, ...(i.children ?? [])]);
    return all.find((l) => l.id === id)!;
  };

  it('/dashboard is exact only', () => {
    expect(isActivePath('/dashboard', link('dashboard'))).toBe(true);
    expect(isActivePath('/dashboard/quotes', link('dashboard'))).toBe(false);
  });

  it('deep links light the right link', () => {
    expect(isActivePath('/dashboard/homepage-pillars/x/edit', link('website-home'))).toBe(true);
    expect(isActivePath('/dashboard/homepage-pillars/x/edit', link('website-services'))).toBe(false);
    expect(isActivePath('/dashboard/testimonials/create', link('website-home'))).toBe(true);
    expect(isActivePath('/dashboard/services/abc/edit', link('website-services'))).toBe(true);
    expect(isActivePath('/dashboard/quotes/123', link('enquiries-quotes'))).toBe(true);
    expect(isActivePath('/dashboard/quotes/123', link('enquiries-contacts'))).toBe(false);
  });

  it('does not match on a shared string prefix', () => {
    expect(isActivePath('/dashboard/services-x', link('website-services'))).toBe(false);
  });

  it('the most specific sibling wins', () => {
    expect(isActivePath('/dashboard/seo', link('seo-overview'))).toBe(true);
    expect(isActivePath('/dashboard/seo/defaults', link('seo-overview'))).toBe(false);
    expect(isActivePath('/dashboard/seo/defaults', link('seo-defaults'))).toBe(true);
    expect(isActivePath('/dashboard/seo/defaults', link('seo'))).toBe(true);
  });

  it('a section is active for any of its children', () => {
    expect(isActivePath('/dashboard/contacts/9', link('enquiries'))).toBe(true);
    expect(isActivePath('/dashboard/projects/create', link('website'))).toBe(true);
    expect(isActivePath('/dashboard/media', link('website'))).toBe(false);
  });
});

describe('activeSection', () => {
  it('returns the section for deep links of a multi-link section', () => {
    expect(activeSection('/dashboard/homepage-pillars/x/edit', ['owner'])?.id).toBe('website');
    expect(activeSection('/dashboard/quotes/123', ['owner'])?.id).toBe('enquiries');
    expect(activeSection('/dashboard/marketing/consent', ['owner'])?.id).toBe('marketing');
  });

  it('is undefined outside sections and for single-child views', () => {
    expect(activeSection('/dashboard', ['owner'])).toBeUndefined();
    expect(activeSection('/dashboard/media', ['owner'])).toBeUndefined();
    expect(activeSection('/dashboard/seo', ['owner'])?.id).toBe('seo');
    // viewer has two seo children, still a section; editor of one visible child is not.
    expect(activeSection('/dashboard/seo', ['viewer'])?.id).toBe('seo');
    expect(activeSection('/dashboard/about', ['intake'])).toBeUndefined();
  });
});

describe('firstReachableHref', () => {
  const item = (id: string) => NAV.find((i) => i.id === id)!;

  it('picks the first child the roles can open', () => {
    expect(firstReachableHref(item('website'), ['owner'])).toBe('/dashboard/home-page');
    expect(firstReachableHref(item('enquiries'), ['intake'])).toBe('/dashboard/quotes');
    expect(firstReachableHref(item('marketing'), ['marketer'])).toBe('/dashboard/marketing');
  });

  it('is null when nothing is reachable', () => {
    expect(firstReachableHref(item('website'), ['intake'])).toBeNull();
    expect(firstReachableHref(item('media'), ['intake'])).toBeNull();
    expect(firstReachableHref(item('media'), ['owner'])).toBe('/dashboard/media');
  });
});
