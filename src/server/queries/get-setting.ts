import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { parseGlobal, type GlobalValue, type PublicGlobalKey } from '@/lib/content/globals';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { settingsRepository } from '@/server/repositories/settings-repository';

// Public reader for one settings document. Cached indefinitely; saving or
// restoring the key expires exactly this tag. A missing row or a malformed value
// (drift) renders the defaults, so the public site never breaks on bad data.
// A failed DB read also renders the defaults, but outside the cache: caught inside,
// the fallback would be cached for good and outlive the outage.
export async function getSetting<K extends PublicGlobalKey>(key: K): Promise<GlobalValue<K>> {
  try {
    return await readSetting(key);
  } catch (error) {
    console.warn(
      `[getSetting] db query for ${key} failed, using default:`,
      error instanceof Error ? error.message : error,
    );
    return parseGlobal(key, undefined);
  }
}

async function readSetting<K extends PublicGlobalKey>(key: K): Promise<GlobalValue<K>> {
  'use cache';
  cacheTag(settingTag(key));
  cacheLife('max');
  const row = await settingsRepository.get(key);
  return parseGlobal(key, row?.value);
}
