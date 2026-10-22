import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/queries/get-setting', () => ({
  getStoredSetting: vi.fn(async () => null),
  getLegacySettings: vi.fn(async () => null),
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
    expect(out.businessName).toBe('Vantage Autobody');
    expect(out.logo).toBeNull();
    expect(warn).toHaveBeenCalled();
  });
});
