import { afterEach, describe, expect, it, vi } from 'vitest';

const { cacheTag, cacheLife, get } = vi.hoisted(() => ({ cacheTag: vi.fn(), cacheLife: vi.fn(), get: vi.fn() }));
vi.mock('next/cache', () => ({ cacheTag, cacheLife }));
vi.mock('@/server/repositories/settings-repository', () => ({ settingsRepository: { get } }));

import { parseGlobal } from '@/lib/content/globals';
import { settingTag } from '@/server/lib/cache/settings-tags';

import { getSetting } from './get-setting';

afterEach(() => vi.clearAllMocks());

describe('getSetting', () => {
  it('tags the read with the key only and caches it for the maximum lifetime', async () => {
    get.mockResolvedValue(null);
    await getSetting('footer');
    expect(cacheTag).toHaveBeenCalledExactlyOnceWith('settings:footer');
    expect(cacheLife).toHaveBeenCalledExactlyOnceWith('max');
    expect(settingTag('page.our-work')).toBe('settings:page.our-work');
  });

  it('returns the defaults when the key was never saved', async () => {
    get.mockResolvedValue(null);
    expect(await getSetting('navigation')).toEqual(parseGlobal('navigation', {}));
  });

  it('returns the stored value, filling missing fields from the defaults', async () => {
    get.mockResolvedValue({ value: { robots: 'noindex' } });
    expect(await getSetting('seo')).toMatchObject({ robots: 'noindex', defaultTitle: 'Vantage Autobody' });
  });

  it('falls back to the defaults, logging, when the stored value has drifted', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    get.mockResolvedValue({ value: { robots: 'sometimes', titleTemplate: 'no placeholder' } });
    expect(await getSetting('seo')).toEqual(parseGlobal('seo', {}));
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
