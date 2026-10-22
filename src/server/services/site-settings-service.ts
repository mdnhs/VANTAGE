import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';
import {
  composePublicSettings,
  PUBLIC_SETTINGS_KEYS,
  type PublicGlobals,
  type PublicSiteSettings,
} from '@/server/lib/settings/public-settings';
import { getSetting } from '@/server/queries/get-setting';
import { siteSettingsRepository } from '@/server/repositories/site-settings-repository';
import type {
  UpdateBusinessInfoInput,
  UpdateContactInput,
  UpdateBrandingInput,
  UpdateHeroMediaInput,
  UpdateHomepageCatalogInput,
  UpdateServicesHeroInput,
  UpdateOurWorkHeroInput,
  UpdateInsurancePageInput,
  UpdateAboutPageInput,
  UpdateProcessPageInput,
  UpdateHomepageHeroInput,
  UpdateSeoInput,
  UpdateSocialLinksInput,
} from '@/validations/site-settings-schema';

const SETTINGS_TAG = CACHE_TAGS.all('site-settings');

export type { PublicSiteSettings };

// Public marketing pages read the versioned settings keys (each cached under its own
// `settings:<key>` tag, expired by a save of that key) and get them in the flat shape the
// marketing components were built against. Malformed or missing keys render the defaults.
async function getPublic(): Promise<PublicSiteSettings> {
  const values = await Promise.all(PUBLIC_SETTINGS_KEYS.map((key) => getSetting(key)));
  return composePublicSettings(
    Object.fromEntries(PUBLIC_SETTINGS_KEYS.map((key, i) => [key, values[i]])) as PublicGlobals,
  );
}

// Same singleton row, same cache tag — each section just writes its own subset of columns
// through the same upsert, so no section can clobber another's fields.
async function updateSection(
  data:
    | UpdateBusinessInfoInput
    | UpdateContactInput
    | UpdateSocialLinksInput
    | UpdateBrandingInput
    | UpdateHeroMediaInput
    | UpdateSeoInput
    | UpdateHomepageHeroInput
    | UpdateHomepageCatalogInput
    | UpdateServicesHeroInput
    | UpdateOurWorkHeroInput
    | UpdateInsurancePageInput
    | UpdateAboutPageInput
    | UpdateProcessPageInput,
) {
  const row = await siteSettingsRepository.upsert(data);
  // Legacy row only: the public site reads the versioned keys now (Phase 11 removes this).
  revalidateTag(SETTINGS_TAG, 'hours');
  return row;
}

export const siteSettingsService = {
  getPublic,

  // Uncached: feeds the admin settings form pre-fill directly, always fresh for the editor.
  async getAdmin() {
    return siteSettingsRepository.get();
  },

  updateBusinessInfo: (data: UpdateBusinessInfoInput) => updateSection(data),
  updateContact: (data: UpdateContactInput) => updateSection(data),
  updateSocialLinks: (data: UpdateSocialLinksInput) => updateSection(data),
  updateBranding: (data: UpdateBrandingInput) => updateSection(data),
  updateHeroMedia: (data: UpdateHeroMediaInput) => updateSection(data),
  updateSeo: (data: UpdateSeoInput) => updateSection(data),
  updateHomepageHero: (data: UpdateHomepageHeroInput) => updateSection(data),
  updateHomepageCatalog: (data: UpdateHomepageCatalogInput) => updateSection(data),
  updateServicesHero: (data: UpdateServicesHeroInput) => updateSection(data),
  updateOurWorkHero: (data: UpdateOurWorkHeroInput) => updateSection(data),
  updateInsurancePage: (data: UpdateInsurancePageInput) => updateSection(data),
  updateAboutPage: (data: UpdateAboutPageInput) => updateSection(data),
  updateProcessPage: (data: UpdateProcessPageInput) => updateSection(data),
};
