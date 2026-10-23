import { collectMediaIds } from '@/lib/content/image-ref';
import { loadPublicImages } from '@/server/lib/media/resolve';
import {
  composePublicSettings,
  PUBLIC_SETTINGS_KEYS,
  type PublicGlobals,
  type PublicSiteSettings,
} from '@/server/lib/settings/public-settings';
import { getSetting } from '@/server/queries/get-setting';

export type { PublicSiteSettings };

// Media-library refs are loaded in one cached query.
async function compose(globals: PublicGlobals): Promise<PublicSiteSettings> {
  return composePublicSettings(globals, await loadPublicImages(collectMediaIds(globals)));
}

// Public marketing pages read the versioned settings keys (each cached under its own
// `settings:<key>` tag, expired by a save of that key) and get them in the flat shape the
// marketing components were built against. Malformed or missing keys render the defaults.
async function getPublic(): Promise<PublicSiteSettings> {
  const values = await Promise.all(PUBLIC_SETTINGS_KEYS.map((key) => getSetting(key)));
  const globals = Object.fromEntries(PUBLIC_SETTINGS_KEYS.map((key, i) => [key, values[i]])) as PublicGlobals;
  try {
    return await compose(globals);
  } catch (error) {
    // A repair failure must never 500 the public site: render the defaults instead.
    console.warn('[site-settings] public read failed, using defaults:', error instanceof Error ? error.message : error);
    return composePublicSettings(globals, {});
  }
}

// Read-only: edits go through the versioned globals service.
export const siteSettingsService = {
  getPublic,
};
