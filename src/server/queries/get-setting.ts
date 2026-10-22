import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { parseGlobal, type GlobalValue, type PublicGlobalKey } from '@/lib/content/globals';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { PUBLIC_SETTINGS_KEYS } from '@/server/lib/settings/public-settings';
import { settingsRepository } from '@/server/repositories/settings-repository';
import { siteSettingsRepository } from '@/server/repositories/site-settings-repository';

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

// Same cached read, but a key that was never saved is `null` (not the defaults), so the
// public adapter can fall back to the legacy site_settings row until the migration has run.
// The cached value is the stored document only; the legacy fallback is never cached here.
export async function getStoredSetting<K extends PublicGlobalKey>(key: K): Promise<GlobalValue<K> | null> {
  'use cache';
  cacheTag(settingTag(key));
  cacheLife('max');
  const row = await settingsRepository.get(key);
  return row ? parseGlobal(key, row.value) : null;
}

// The legacy `site_settings` row, only read while some public key was never saved. Cached so no
// prerender touches the DB uncached; tagged with every public key, so a save of any one of them
// (which expires its own tag) also drops this copy and the fallback is re-derived.
export async function getLegacySettings() {
  'use cache';
  for (const key of PUBLIC_SETTINGS_KEYS) cacheTag(settingTag(key));
  cacheLife('max');
  return (await siteSettingsRepository.get()) ?? null;
}
