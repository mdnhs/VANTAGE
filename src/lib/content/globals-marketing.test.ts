import { describe, expect, it, vi } from 'vitest';

import { GA4_ID, GTM_ID, PIXEL_ID, validId } from '@/lib/tracking/ids';

import { GLOBAL_ACCESS } from './global-access';
import { parseTracking } from './globals-marketing';
import { PUBLIC_GLOBAL_KEYS, GLOBALS, parseGlobal } from './globals';

const issuesAt = (key: 'consent' | 'scripts', value: unknown) => {
  const r = GLOBALS[key].safeParse(value);
  return r.success ? [] : r.error.issues;
};

describe('consent global', () => {
  it('defaults to the VANTAGE copy with the banner off', () => {
    expect(parseGlobal('consent', {})).toEqual({
      enabled: false,
      title: 'Cookies on this site',
      body: 'We use analytics and marketing cookies to understand how the site is used and to measure our adverts. They are only set if you allow them. Necessary cookies keep the site working.',
      accept: 'Accept all',
      reject: 'Reject all',
      customise: 'Customise',
      save: 'Save choices',
      settingsLink: 'Cookie settings',
      policyLabel: 'Privacy policy',
      policyHref: '',
      categories: {
        necessary: 'Needed for the site to work, such as remembering your cookie choice. Always on.',
        analytics: 'Google Analytics, to count visits and see which pages help (through Google Tag Manager).',
        marketing: 'Meta (Facebook) Pixel and ad measurement, to see whether our adverts lead to enquiries.',
      },
      reconsentMonths: 6,
      version: 1,
    });
  });

  it('accepts being switched on with the default copy', () => {
    expect(GLOBALS.consent.safeParse({ enabled: true }).success).toBe(true);
  });

  it('rejects enabling with a blank title', () => {
    const issues = issuesAt('consent', { enabled: true, title: '' });
    expect(issues.map((i) => i.path.join('.'))).toEqual(['title']);
    expect(issues[0]?.message).toBe('Fill this in before turning the banner on');
  });

  it('allows blank copy while the banner is off', () => {
    expect(GLOBALS.consent.safeParse({ enabled: false, title: '' }).success).toBe(true);
  });

  it('bounds re-consent months and version', () => {
    expect(GLOBALS.consent.safeParse({ reconsentMonths: 7 }).success).toBe(false);
    expect(GLOBALS.consent.safeParse({ reconsentMonths: 0 }).success).toBe(false);
    expect(GLOBALS.consent.safeParse({ version: 0 }).success).toBe(false);
  });
});

describe('scripts global', () => {
  const snippet = (over: Record<string, unknown>) => ({ snippets: [{ name: 'x', ...over }] });

  it('defaults to no snippets', () => {
    expect(parseGlobal('scripts', {})).toEqual({ snippets: [] });
  });

  it('accepts an inline snippet', () => {
    expect(GLOBALS.scripts.safeParse(snippet({ inline: 'window.a = 1;' })).success).toBe(true);
  });

  it('rejects src and inline together, at src', () => {
    const issues = issuesAt('scripts', snippet({ src: 'https://a.example/x.js', inline: 'a()' }));
    expect(issues.map((i) => i.path.join('.'))).toEqual(['snippets.0.src']);
  });

  it('rejects a snippet with neither', () => {
    expect(issuesAt('scripts', snippet({})).map((i) => i.path.join('.'))).toEqual(['snippets.0.src']);
  });

  it('rejects an external script while the host list is empty', () => {
    const issues = issuesAt('scripts', snippet({ src: 'https://evil.example/x.js' }));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toBe('External scripts are not allowed yet; use inline code');
  });

  it('checks route patterns', () => {
    expect(GLOBALS.scripts.safeParse(snippet({ inline: 'a()', routes: ['services'] })).success).toBe(false);
    expect(GLOBALS.scripts.safeParse(snippet({ inline: 'a()', routes: ['/services/*'] })).success).toBe(true);
  });
});

describe('tracking settings', () => {
  it('falls back to defaults on drift and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const value = parseTracking({ gtmId: 'bad' });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
    expect(value).toEqual({
      gtmId: '',
      ga4Id: '',
      metaPixelId: '',
      capiTokenEncrypted: null,
      testEventCode: '',
      enabled: { gtm: false, ga4: false, meta: false, capi: false },
      enhancedMatching: { enabled: false, acknowledgedAt: null, acknowledgedBy: null },
    });
  });

  it('keeps valid ids', () => {
    expect(parseTracking({ gtmId: 'GTM-TEST123', ga4Id: 'G-TEST123', metaPixelId: '1234567890' })).toMatchObject({
      gtmId: 'GTM-TEST123',
      ga4Id: 'G-TEST123',
      metaPixelId: '1234567890',
    });
  });

  it('is not an editable global', () => {
    expect(Object.keys(GLOBALS)).not.toContain('tracking');
  });
});

describe('ids', () => {
  it('validates against the pattern', () => {
    expect(validId(GTM_ID, 'GTM-TEST123')).toBe('GTM-TEST123');
    expect(validId(GTM_ID, 'gtm-x')).toBeNull();
    expect(validId(GA4_ID, 'G-TEST123')).toBe('G-TEST123');
    expect(validId(PIXEL_ID, '1234567890')).toBe('1234567890');
    expect(validId(PIXEL_ID, '123')).toBeNull();
    expect(validId(GTM_ID, null)).toBeNull();
  });
});

describe('registration', () => {
  it('exposes consent and scripts publicly', () => {
    expect(PUBLIC_GLOBAL_KEYS).toContain('consent');
    expect(PUBLIC_GLOBAL_KEYS).toContain('scripts');
  });

  it('gates custom code on code.update', () => {
    expect(GLOBAL_ACCESS.scripts.read).toEqual({ code: ['update'] });
    expect(GLOBAL_ACCESS.scripts.update).toEqual({ code: ['update'] });
    expect(GLOBAL_ACCESS.consent.read).toEqual({ tracking: ['read'] });
  });
});
