import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { isEnabled } = vi.hoisted(() => ({ isEnabled: { value: false } }));
vi.mock('next/headers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/headers')>()),
  draftMode: async () => ({
    get isEnabled() {
      return isEnabled.value;
    },
  }),
}));
vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

import { cacheLife, cacheTag } from 'next/cache';

import { DEFAULT_THEME, ThemeConfig } from '@/lib/theme/schema';
import { db } from '@/server/db';
import { settings } from '@/server/db/schema';
import { getPublishedTheme, getSiteThemeForRender } from '@/server/queries/get-theme';

const published = ThemeConfig.parse({ site: { brand: '#b91c1c' } });
const draft = ThemeConfig.parse({ site: { brand: '#7f1d1d', fonts: { heading: 'sora' } } });

beforeEach(async () => {
  await db.execute(sql`truncate table settings`);
  isEnabled.value = false;
  vi.mocked(cacheTag).mockClear();
  vi.mocked(cacheLife).mockClear();
});

describe('getPublishedTheme', () => {
  it('returns the defaults with no row and tags the read', async () => {
    expect(await getPublishedTheme()).toEqual(DEFAULT_THEME);
    expect(cacheTag).toHaveBeenCalledWith('settings:theme');
    expect(cacheLife).toHaveBeenCalledWith('max');
  });

  it('returns the stored value', async () => {
    await db.insert(settings).values({ key: 'theme', value: published, draft });
    expect(await getPublishedTheme()).toEqual(published);
  });
});

describe('getSiteThemeForRender', () => {
  it('serves the published site when draft mode is off', async () => {
    await db.insert(settings).values({ key: 'theme', value: published, draft });
    expect(await getSiteThemeForRender()).toEqual({ site: published.site, preview: false });
    expect(cacheTag).toHaveBeenCalledWith('settings:theme');
  });

  it('serves the draft site in draft mode', async () => {
    isEnabled.value = true;
    await db.insert(settings).values({ key: 'theme', value: published, draft });
    expect(await getSiteThemeForRender()).toEqual({ site: draft.site, preview: true });
  });

  it('serves the published site in draft mode when there is no draft', async () => {
    isEnabled.value = true;
    await db.insert(settings).values({ key: 'theme', value: published });
    expect(await getSiteThemeForRender()).toEqual({ site: published.site, preview: false });
  });
});
