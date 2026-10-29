import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseGlobal, type PublicGlobalKey } from '@/lib/content/globals';

vi.mock('@/server/queries/get-setting', () => ({
  getSetting: vi.fn(async (key: PublicGlobalKey) => parseGlobal(key, undefined)),
}));
vi.mock('@/server/lib/media/resolve', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/lib/media/resolve')>()),
  loadPublicImages: vi.fn(async () => {
    throw new Error('db down');
  }),
}));

import { siteSettingsService } from './site-settings-service';

afterEach(() => vi.restoreAllMocks());

describe('siteSettingsService.getPublic', () => {
  it('still renders the defaults when the media query fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = await siteSettingsService.getPublic();
    // No name saved: the site's domain stands in.
    expect(out.businessName).toBe('localhost');
    expect(out.logo).toBeNull();
    expect(warn).toHaveBeenCalled();
  });
});
