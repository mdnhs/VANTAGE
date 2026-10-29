import { afterEach, describe, expect, it, vi } from 'vitest';

import { GLOBALS, parseGlobal, type GlobalKey } from './globals';

const KEYS = Object.keys(GLOBALS) as GlobalKey[];

afterEach(() => vi.restoreAllMocks());

describe('globals schemas', () => {
  it('has every key from the plan', () => {
    expect([...KEYS].sort()).toEqual(
      [
        'site',
        'contact',
        'navigation',
        'footer',
        'quoteForm',
        'contactForm',
        'microcopy',
        'notifications',
        'privacy',
        'seo',
        'page.home',
        'page.services',
        'page.our-work',
        'page.insurance',
        'page.about',
        'page.process',
        'consent',
        'scripts',
        'seo.page.home',
        'seo.page.services',
        'seo.page.our-work',
        'seo.page.insurance',
        'seo.page.about',
        'seo.page.process',
        'seo.page.contact',
        'seo.page.get-a-quote',
      ].sort(),
    );
  });

  it.each(KEYS)('%s: an empty value parses to its defaults without a warning', (key) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const value = parseGlobal(key, {});
    expect(warn).not.toHaveBeenCalled();
    // Idempotent: the defaults are themselves valid.
    expect(GLOBALS[key].parse(value)).toEqual(value);
    expect(parseGlobal(key, undefined)).toEqual(value);
    expect(parseGlobal(key, null)).toEqual(value);
  });
});

describe('defaults equal today’s public copy', () => {
  it('site / contact / navigation / footer', () => {
    expect(parseGlobal('site', {})).toMatchObject({ name: 'Vantage Autobody', logo: null, favicon: null, social: [] });
    expect(parseGlobal('contact', {})).toMatchObject({
      email: 'info@vantageautobody.ie',
      phone: { display: '+353 1 234 5678', e164: '+35312345678' },
      address: { lines: ['Unit 4, Industrial Estate, Dublin Road, Ireland'] },
      hours: { summary: 'Mon–Fri: 8:00 – 18:00' },
    });
    const nav = parseGlobal('navigation', {});
    expect(nav.links.map((l) => [l.label, l.href, l.mobileOnly])).toEqual([
      ['Home', '/', false],
      ['Services', '/services', false],
      ['Our Work', '/our-work', false],
      ['Insurance', '/insurance', false],
      ['Contact', '/contact', false],
      ['About', '/about', true],
      ['Process', '/process', true],
    ]);
    expect(nav.cta).toMatchObject({ label: 'Get a Free Quote', shortLabel: 'Free Quote', href: '/#estimator' });
    const footer = parseGlobal('footer', {});
    expect(footer.columns.map((c) => c.title)).toEqual(['Services', 'Company']);
    // Legal pages are listed from Dashboard → Legal pages; the old #privacy/#terms placeholders are gone.
    expect(footer.legalLinks).toEqual([{ label: 'Login', href: '/login' }]);
    // Blank: the footer then prints the site name (settings.businessName), as before.
    expect(footer.copyrightName).toBe('');
  });

  it('page.home takes the hero, trust badges and catalog copy of the site settings fallback', () => {
    const home = parseGlobal('page.home', {});
    expect(home.hero).toMatchObject({
      eyebrow: "Ireland's Premier Collision & Respray Specialists",
      line1: 'We Restore',
      line2: 'Your Car',
      accent: 'To Its Best.',
      video: null,
      fallbackImage: null,
      videoEnabled: false,
    });
    expect(home.trustBadges).toEqual([
      { title: '4.9★ Google Rated', subtitle: '180+ Dublin Reviews' },
      { title: 'Direct Insurer Billing', subtitle: 'AXA, Allianz, Zurich' },
      { title: 'Lifetime Paint Warranty', subtitle: 'Standox & PPG Systems' },
      { title: 'Courtesy Replacement', subtitle: 'Cars Available On-Site' },
    ]);
    expect(home.catalog).toMatchObject({ eyebrow: 'Specialist Autobody Divisions', accent: 'Showroom Finish.' });
    expect(parseGlobal('page.services', {}).hero).toMatchObject({
      eyebrow: 'Master Craftsmanship',
      line1: 'Professional Bodywork.',
      accent: 'Precision Finish.',
    });
    expect(parseGlobal('page.our-work', {}).hero).toMatchObject({
      eyebrow: 'Portfolio',
      line1: 'Our Recent',
      accent: 'Restorations.',
    });
  });

  it('seo gains verification and business without drift for a stored Phase 4 value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseGlobal('seo', {})).toMatchObject({
      verification: { google: '', bing: '' },
      business: { type: 'AutoBodyShop', priceRange: '', sameAs: [] },
    });
    const stored = { titleTemplate: '%s | Vantage', defaultTitle: 'T', robots: 'noindex' };
    expect(parseGlobal('seo', stored)).toMatchObject({ ...stored, verification: { google: '', bing: '' } });
    expect(warn).not.toHaveBeenCalled();
    expect(GLOBALS.seo.safeParse({ verification: { google: '<meta name=x>' } }).success).toBe(false);
    expect(GLOBALS.seo.safeParse({ verification: { google: 'abc_DEF-123' } }).success).toBe(true);
    expect(GLOBALS.seo.safeParse({ business: { type: 'Bakery' } }).success).toBe(false);
    expect(GLOBALS.seo.safeParse({ business: { sameAs: ['http://x.ie', 'nope'] } }).success).toBe(false);
    expect(GLOBALS.seo.safeParse({ business: { sameAs: Array(11).fill('https://x.ie') } }).success).toBe(false);
    expect(parseGlobal('seo.page.services', {})).toMatchObject({ title: '', ogImage: null, noindex: false });
  });

  it('seo and privacy defaults', () => {
    expect(parseGlobal('seo', {})).toMatchObject({
      titleTemplate: '',
      defaultTitle: '',
      defaultDescription: '',
      defaultOgImage: null,
      twitterHandle: '',
      robots: 'index',
    });
    expect(parseGlobal('privacy', {})).toEqual({ enquiryRetentionMonths: 24, spamRetentionDays: 30 });
    expect(parseGlobal('notifications', {})).toEqual({
      recipients: [],
      includeMessage: false,
      autoReply: { enabled: false, subject: '', body: '' },
    });
  });
});

describe('globals limits', () => {
  it('caps navigation links at 7, footer columns at 4, legal links at 6, recipients at 10', () => {
    const link = { label: 'x', href: '/x' };
    expect(GLOBALS.navigation.safeParse({ links: Array(7).fill(link) }).success).toBe(true);
    expect(GLOBALS.navigation.safeParse({ links: Array(8).fill(link) }).success).toBe(false);
    expect(GLOBALS.footer.safeParse({ columns: Array(5).fill({ title: 't', links: [] }) }).success).toBe(false);
    expect(GLOBALS.footer.safeParse({ legalLinks: Array(7).fill(link) }).success).toBe(false);
    const emails = (n: number) => Array.from({ length: n }, (_, i) => `a${i}@example.com`);
    expect(GLOBALS.notifications.safeParse({ recipients: emails(10) }).success).toBe(true);
    expect(GLOBALS.notifications.safeParse({ recipients: emails(11) }).success).toBe(false);
  });

  it('bounds the privacy retention windows', () => {
    expect(GLOBALS.privacy.safeParse({ enquiryRetentionMonths: 0 }).success).toBe(false);
    expect(GLOBALS.privacy.safeParse({ enquiryRetentionMonths: 120 }).success).toBe(true);
    expect(GLOBALS.privacy.safeParse({ enquiryRetentionMonths: 121 }).success).toBe(false);
    expect(GLOBALS.privacy.safeParse({ spamRetentionDays: 365 }).success).toBe(true);
    expect(GLOBALS.privacy.safeParse({ spamRetentionDays: 366 }).success).toBe(false);
  });

  it('needs %s in the seo title template', () => {
    expect(GLOBALS.seo.safeParse({ titleTemplate: 'No placeholder' }).success).toBe(false);
    expect(GLOBALS.seo.safeParse({ titleTemplate: '%s | Site' }).success).toBe(true);
    expect(GLOBALS.seo.safeParse({ titleTemplate: '' }).success).toBe(true);
  });

  it('accepts cloudinary and media image refs, rejects other shapes', () => {
    const id = '5b0e7a64-3a4e-4a52-9d1e-0a6b7c6a9d11';
    expect(GLOBALS.site.safeParse({ logo: { kind: 'cloudinary', publicId: 'a/b' } }).success).toBe(true);
    expect(GLOBALS.site.safeParse({ logo: { kind: 'media', id } }).success).toBe(true);
    expect(GLOBALS.site.safeParse({ logo: { kind: 'media', id: 'nope' } }).success).toBe(false);
    expect(GLOBALS.site.safeParse({ logo: 'a/b' }).success).toBe(false);
  });

  it('requires closing after opening and accepts http(s) and relative links', () => {
    const row = (opens: string, closes: string) => ({ hours: { weekly: [{ days: [1], opens, closes }] } });
    expect(GLOBALS.contact.safeParse(row('08:00', '18:00')).success).toBe(true);
    expect(GLOBALS.contact.safeParse(row('18:00', '08:00')).success).toBe(false);
    expect(GLOBALS.contact.safeParse(row('08:00', '08:00')).success).toBe(false);
    const nav = (href: string) => GLOBALS.navigation.safeParse({ links: [{ label: 'x', href }] }).success;
    expect(nav('http://example.com')).toBe(true);
    expect(nav('https://example.com')).toBe(true);
    expect(nav('/a')).toBe(true);
    expect(nav('javascript:alert(1)')).toBe(false);
  });

  it('validates phone E.164, emails and hours', () => {
    expect(GLOBALS.contact.safeParse({ phone: { display: '1', e164: '0123' } }).success).toBe(false);
    expect(GLOBALS.contact.safeParse({ email: 'nope' }).success).toBe(false);
    expect(
      GLOBALS.contact.safeParse({ hours: { weekly: [{ days: [1], opens: '25:00', closes: '18:00' }] } }).success,
    ).toBe(false);
  });
});

describe('parseGlobal isolation', () => {
  it('returns a fresh copy, so mutating one result never changes the next', () => {
    const first = parseGlobal('navigation', {});
    first.links[0]!.label = 'Changed';
    const firstFooter = parseGlobal('footer', {});
    firstFooter.columns[0]!.links[0]!.label = 'Changed';
    expect(parseGlobal('navigation', {}).links[0]!.label).not.toBe('Changed');
    expect(parseGlobal('footer', {}).columns[0]!.links[0]!.label).not.toBe('Changed');
  });
});

describe('parseGlobal drift', () => {
  it('falls back to defaults and logs when the stored value is malformed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const value = parseGlobal('contact', { email: 'not-an-email', phone: 42 });
    expect(value).toEqual(parseGlobal('contact', {}));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain('contact');
  });

  it('keeps valid stored values', () => {
    expect(parseGlobal('privacy', { enquiryRetentionMonths: 12 })).toEqual({
      enquiryRetentionMonths: 12,
      spamRetentionDays: 30,
    });
  });
});
