import {
  composePublicSettings,
  PUBLIC_SETTINGS_KEYS,
  type PublicSiteSettings,
} from '@/server/lib/settings/public-settings';
import { resolvePublicGlobals } from '@/server/lib/settings/site-settings-migration';
import { getStoredSetting } from '@/server/queries/get-setting';
import { siteSettingsRepository } from '@/server/repositories/site-settings-repository';

export type { PublicSiteSettings };

// Public marketing pages read the versioned settings keys (each cached under its own
// `settings:<key>` tag, expired by a save of that key) and get them in the flat shape the
// marketing components were built against. Malformed or missing keys render the defaults.
async function getPublic(): Promise<PublicSiteSettings> {
  const values = await Promise.all(PUBLIC_SETTINGS_KEYS.map((key) => getStoredSetting(key)));
  const stored = Object.fromEntries(PUBLIC_SETTINGS_KEYS.map((key, i) => [key, values[i]])) as Parameters<
    typeof resolvePublicGlobals
  >[0];
  // Uncached on purpose: until `yarn settings:migrate` has run, never-saved keys come from the legacy
  // row, and that must not be frozen into the per-key cache.
  const legacy = values.some((v) => v === null) ? await siteSettingsRepository.get() : null;
  return composePublicSettings(resolvePublicGlobals(stored, legacy));
}

// Read-only: edits go through the versioned globals service.
export const siteSettingsService = {
  getPublic,
};
