import {
  composePublicSettings,
  PUBLIC_SETTINGS_KEYS,
  type PublicSiteSettings,
} from '@/server/lib/settings/public-settings';
import { resolvePublicGlobals } from '@/server/lib/settings/site-settings-migration';
import { getLegacySettings, getStoredSetting } from '@/server/queries/get-setting';

export type { PublicSiteSettings };

// Public marketing pages read the versioned settings keys (each cached under its own
// `settings:<key>` tag, expired by a save of that key) and get them in the flat shape the
// marketing components were built against. Malformed or missing keys render the defaults.
async function getPublic(): Promise<PublicSiteSettings> {
  const values = await Promise.all(PUBLIC_SETTINGS_KEYS.map((key) => getStoredSetting(key)));
  const stored = Object.fromEntries(PUBLIC_SETTINGS_KEYS.map((key, i) => [key, values[i]])) as Parameters<
    typeof resolvePublicGlobals
  >[0];
  // Until `yarn settings:migrate` has run, never-saved keys come from the legacy row. That read is
  // cached under every public key's tag, so saving any key also drops the cached fallback.
  const legacy = values.some((v) => v === null) ? await getLegacySettings() : null;
  try {
    return composePublicSettings(resolvePublicGlobals(stored, legacy));
  } catch (error) {
    // A repair failure must never 500 the public site: render the defaults instead.
    console.warn('[site-settings] public read failed, using defaults:', error instanceof Error ? error.message : error);
    return composePublicSettings(resolvePublicGlobals(stored, null));
  }
}

// Read-only: edits go through the versioned globals service.
export const siteSettingsService = {
  getPublic,
};
