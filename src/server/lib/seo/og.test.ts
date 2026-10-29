import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PUBLIC_PAGES } from '@/lib/seo/public-pages';

const seo: Record<string, { ogTitle: string; title: string }> = {};
vi.mock('next/cache', () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock('@/server/queries/get-setting', () => ({
  getSetting: async (key: string) => seo[key] ?? { ogTitle: '', title: '' },
}));
vi.mock('@/server/services/site-settings-service', () => ({
  siteSettingsService: { getPublic: async () => ({ businessName: 'Vantage Autobody' }) },
}));
vi.mock('@/server/queries/get-theme', () => ({ getPublishedTheme: vi.fn() }));

import { ogSubjectFor } from './og';

beforeEach(() => {
  for (const k of Object.keys(seo)) delete seo[k];
});

describe('ogSubjectFor', () => {
  it('prefers the share title, then the SEO title, then the registry title', async () => {
    seo['seo.page.about'] = { ogTitle: 'Share title', title: 'SEO title' };
    expect((await ogSubjectFor('about')).title).toBe('Share title');
    seo['seo.page.about'] = { ogTitle: '  ', title: 'SEO title' };
    expect((await ogSubjectFor('about')).title).toBe('SEO title');
    delete seo['seo.page.about'];
    expect((await ogSubjectFor('about')).title).toBe('About Our Dublin Body Shop');
  });

  it('home falls back to the site name and every card uses the home title as eyebrow', async () => {
    const home = await ogSubjectFor('home');
    expect(home).toEqual({ title: 'Vantage Autobody', eyebrow: PUBLIC_PAGES.home.title, siteName: 'Vantage Autobody' });
    expect((await ogSubjectFor('services')).eyebrow).toBe(PUBLIC_PAGES.home.title);
  });

  it('strips emoji from the title', async () => {
    seo['seo.page.about'] = { ogTitle: 'Fast \u{1F697} repairs \u2764\uFE0F today', title: '' };
    expect((await ogSubjectFor('about')).title).toBe('Fast repairs today');
    seo['seo.page.about'] = { ogTitle: '\u{1F697}', title: '' };
    expect((await ogSubjectFor('about')).title).toBe('About Our Dublin Body Shop');
  });

  it('cuts a long title to 90 characters with an ellipsis', async () => {
    seo['seo.page.about'] = { ogTitle: 'word '.repeat(40), title: '' };
    const { title } = await ogSubjectFor('about');
    expect([...title].length).toBeLessThanOrEqual(90);
    expect(title.endsWith('…')).toBe(true);
  });
});
