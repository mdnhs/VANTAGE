import { describe, expect, it } from 'vitest';

import { hasPermission, ROLE_NAMES, type RoleName } from '@/lib/auth/permissions';

import {
  EDITABLE_GLOBAL_KEYS,
  GLOBAL_ACCESS,
  GLOBAL_LABELS,
  SETTINGS_PAGES,
  SETTINGS_PAGE_LABELS,
} from './global-access';
import { GLOBALS, PUBLIC_GLOBAL_KEYS, type GlobalKey } from './globals';

type Group = 'settings' | 'globals' | 'seo' | 'page' | 'tracking' | 'code';

const GROUP: Record<GlobalKey, Group> = {
  site: 'settings',
  notifications: 'settings',
  privacy: 'settings',
  contact: 'globals',
  navigation: 'globals',
  footer: 'globals',
  quoteForm: 'globals',
  contactForm: 'globals',
  microcopy: 'globals',
  seo: 'seo',
  'page.home': 'page',
  'page.services': 'page',
  'page.our-work': 'page',
  'page.insurance': 'page',
  'page.about': 'page',
  'page.process': 'page',
  consent: 'tracking',
  scripts: 'code',
};

// What the MK matrix grants each role, per resource group: [read, update].
const GRANTS: Record<RoleName, Record<Group, [boolean, boolean]>> = {
  owner: {
    settings: [true, true],
    globals: [true, true],
    seo: [true, true],
    page: [true, true],
    tracking: [true, true],
    code: [true, true],
  },
  admin: {
    settings: [true, true],
    globals: [true, true],
    seo: [true, true],
    page: [true, true],
    tracking: [true, true],
    code: [false, false],
  },
  editor: {
    settings: [false, false],
    globals: [true, true],
    seo: [true, true],
    page: [true, true],
    tracking: [false, false],
    code: [false, false],
  },
  author: {
    settings: [false, false],
    globals: [false, false],
    seo: [false, false],
    page: [true, false],
    tracking: [false, false],
    code: [false, false],
  },
  marketer: {
    settings: [false, false],
    globals: [true, false],
    seo: [true, true],
    page: [true, false],
    tracking: [true, true],
    code: [false, false],
  },
  intake: {
    settings: [false, false],
    globals: [false, false],
    seo: [false, false],
    page: [false, false],
    tracking: [false, false],
    code: [false, false],
  },
  viewer: {
    settings: [false, false],
    globals: [true, false],
    seo: [true, false],
    page: [true, false],
    tracking: [false, false],
    code: [false, false],
  },
};

describe('global access', () => {
  it('covers every global exactly once', () => {
    expect([...EDITABLE_GLOBAL_KEYS].sort()).toEqual(Object.keys(GLOBALS).sort());
    expect(Object.keys(GLOBAL_ACCESS).sort()).toEqual(Object.keys(GLOBALS).sort());
    expect(Object.keys(GLOBAL_LABELS).sort()).toEqual(Object.keys(GLOBALS).sort());
  });

  it('keeps notifications and privacy out of the public keys', () => {
    expect(PUBLIC_GLOBAL_KEYS).not.toContain('notifications');
    expect(PUBLIC_GLOBAL_KEYS).not.toContain('privacy');
    expect([...PUBLIC_GLOBAL_KEYS].sort()).toEqual(
      Object.keys(GLOBALS)
        .filter((k) => k !== 'notifications' && k !== 'privacy')
        .sort(),
    );
  });

  describe.each(ROLE_NAMES)('%s', (role) => {
    it.each(EDITABLE_GLOBAL_KEYS)('%s read/update', (key) => {
      const [read, update] = GRANTS[role][GROUP[key]];
      expect(hasPermission([role], GLOBAL_ACCESS[key].read)).toBe(read);
      expect(hasPermission([role], GLOBAL_ACCESS[key].update)).toBe(update);
    });
  });

  it('maps the settings pages to their documents', () => {
    expect(SETTINGS_PAGES).toEqual({
      identity: ['site'],
      contact: ['contact'],
      navigation: ['navigation'],
      footer: ['footer'],
      forms: ['quoteForm', 'contactForm', 'microcopy'],
      notifications: ['notifications'],
      privacy: ['privacy'],
    });
    expect(Object.keys(SETTINGS_PAGE_LABELS).sort()).toEqual(Object.keys(SETTINGS_PAGES).sort());
  });
});
