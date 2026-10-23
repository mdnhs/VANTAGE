import { describe, expect, it } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';

import type { PublicImage } from '@/lib/media/public-image';

import { composeLegacyView, composePublicSettings, PUBLIC_SETTINGS_KEYS, type PublicGlobals } from './public-settings';

const defaults = () =>
  Object.fromEntries(
    PUBLIC_SETTINGS_KEYS.map((key) => [key, structuredClone(parseGlobal(key, {}))]),
  ) as unknown as PublicGlobals;

describe('composePublicSettings blank list items', () => {
  it('drops list items whose primary text is blank, as the old forms did', () => {
    const g = defaults();
    g['page.insurance'].coordination.features.push({ title: '  ', description: 'orphan' });
    g['page.insurance'].steps.items.push({ label: '', description: 'orphan' });
    g['page.about'].team.members.push({ name: '', role: 'Nobody', image: null });
    g['page.about'].standards.items.push({ title: ' ', description: 'orphan' });

    const out = composePublicSettings(g, {});
    const base = composePublicSettings(defaults(), {});
    expect(out.insuranceFeatures).toEqual(base.insuranceFeatures);
    expect(out.insuranceSteps).toEqual(base.insuranceSteps);
    expect(out.aboutTeamMembers).toEqual(base.aboutTeamMembers);
    expect(out.aboutStandardsItems).toEqual(base.aboutStandardsItems);
  });
});

describe('composePublicSettings images', () => {
  const ID = '0b1c1c52-0000-4000-8000-000000000001';
  const image = (src: string): PublicImage => ({
    id: ID,
    src,
    mimeType: 'image/png',
    width: 10,
    height: 10,
    alt: 'a',
    blurDataUrl: null,
    focal: { x: 0.5, y: 0.5 },
  });
  const withCloud = (fn: () => void) => {
    const prev = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'demo';
    try {
      fn();
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      else process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = prev;
    }
  };

  it('resolves a media ref from the image map', () => {
    const g = defaults();
    g.site.logo = { kind: 'media', id: ID };
    const out = composePublicSettings(g, { [ID]: image('https://cdn.example/logo.png') });
    expect(out.logo?.src).toBe('https://cdn.example/logo.png');
  });

  it('resolves a Cloudinary ref to null (no legacy Cloudinary fallback in settings)', () => {
    withCloud(() => {
      const g = defaults();
      g.site.logo = { kind: 'cloudinary', publicId: 'vantage/logo' };
      g['page.home'].hero.video = { kind: 'cloudinary', publicId: 'vantage/hero' };
      g['page.about'].team.members[0]!.image = { kind: 'cloudinary', publicId: 'vantage/ann' };
      const out = composePublicSettings(g, {});
      expect(out.logo).toBeNull();
      expect(out.heroVideo).toBeNull();
      expect(out.aboutTeamMembers[0]?.image).toBeNull();
    });
  });

  it('is null for a media ref missing from the map, an empty ref and an unset cloud name', () => {
    const g = defaults();
    g.site.logo = { kind: 'media', id: ID };
    g.site.favicon = { kind: 'cloudinary', publicId: 'x' };
    const prev = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    try {
      const out = composePublicSettings(g, {});
      expect(out.logo).toBeNull();
      expect(out.favicon).toBeNull();
      expect(out.aboutHeroImage).toBeNull();
    } finally {
      if (prev !== undefined) process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = prev;
    }
  });

  it('keeps every Phase 4 field identical to the legacy view for a populated fixture', () => {
    const g = defaults();
    g.site.name = 'Acme Autobody';
    g.site.logo = { kind: 'cloudinary', publicId: 'vantage/logo' };
    g.contact.phone.display = '+353 1 999 0000';
    g['page.home'].hero.eyebrow = 'Eyebrow';
    g['page.about'].heritage.quote = 'A quote';
    g['page.about'].team.members.push({ name: 'Ann', role: 'Painter', image: null });
    g['page.insurance'].disclaimer = 'Fine print';
    const out = composePublicSettings(g, {}) as Record<string, unknown>;
    const legacy = composeLegacyView(g) as Record<string, unknown>;
    const imageKeys = [
      'logo',
      'favicon',
      'heroVideo',
      'heroFallbackImage',
      'aboutHeroImage',
      'aboutHeritageImage',
      'aboutStandardsImage',
      'phoneHref',
    ];
    const legacyImageKeys = [
      'logoPublicId',
      'faviconPublicId',
      'heroVideoPublicId',
      'heroFallbackImagePublicId',
      'ogImagePublicId',
      'aboutHeroImagePublicId',
      'aboutHeritageImagePublicId',
      'aboutStandardsImagePublicId',
      'metaTitle',
      'metaDescription',
      'twitterHandle',
    ];
    const strip = (o: Record<string, unknown>, drop: string[]) =>
      Object.fromEntries(Object.entries(o).filter(([k]) => !drop.includes(k) && k !== 'aboutTeamMembers'));
    expect(strip(out, imageKeys)).toEqual(strip(legacy, legacyImageKeys));
    expect(out.phoneHref).toBe('tel:+35312345678');
    expect(out.aboutTeamMembers).toEqual(
      (legacy.aboutTeamMembers as { name: string; role: string }[]).map((m) => ({
        name: m.name,
        role: m.role,
        image: null,
      })),
    );
  });
});
