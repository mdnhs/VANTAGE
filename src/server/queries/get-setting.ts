import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { parseGlobal, type GlobalValue, type PublicGlobalKey } from '@/lib/content/globals';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { settingsRepository } from '@/server/repositories/settings-repository';

// Public reader for one settings document. Cached indefinitely; saving or
// restoring the key expires exactly this tag. A missing row or a malformed value
// (drift) renders the defaults, so the public site never breaks on bad data.
export async function getSetting<K extends PublicGlobalKey>(key: K): Promise<GlobalValue<K>> {
  'use cache';
  cacheTag(settingTag(key));
  cacheLife('max');
  const row = await settingsRepository.get(key);
  return parseGlobal(key, row?.value);
}
