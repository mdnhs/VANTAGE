import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { siteSettingsRepository } from '@/server/repositories/site-settings-repository';
import type {
  UpdateBusinessInfoInput,
  UpdateContactInput,
  UpdateHeroMediaInput,
  UpdateSeoInput,
  UpdateSocialLinksInput,
} from '@/validations/site-settings-schema';

const SETTINGS_TAG = CACHE_TAGS.all('site-settings');

// Fallback mirrors today's hardcoded marketing copy (footer.tsx / hero-section.tsx /
// header.tsx) so the public site's visible content does not change until an admin edits
// settings for the first time — i.e. before any row exists in the table.
const FALLBACK_SETTINGS = {
  businessName: 'Vantage Autobody',
  phone: '+353 1 234 5678',
  emergencyPhone: null,
  email: 'info@vantageautobody.ie',
  address: 'Unit 4, Industrial Estate, Dublin Road, Ireland',
  openingHours: 'Mon–Fri: 8:00 – 18:00',
  googleMapsUrl: null,
  whatsappNumber: null,
  facebookUrl: null,
  instagramUrl: null,
  tiktokUrl: null,
  linkedinUrl: null,
  logoPublicId: null,
  faviconPublicId: null,
  heroVideoPublicId: null,
  heroFallbackImagePublicId: null,
  heroVideoEnabled: false,
  metaTitle: null,
  metaDescription: null,
  ogImagePublicId: null,
  twitterHandle: null,
} as const;

export type PublicSiteSettings = Awaited<ReturnType<typeof getPublicUncached>>;

async function getPublicUncached() {
  const row = await siteSettingsRepository.get();
  return row ?? FALLBACK_SETTINGS;
}

// Public marketing pages read this — safe to serve stale for a while since settings change
// rarely and every mutation explicitly revalidates the tag.
async function getPublicCached() {
  'use cache';
  cacheTag(SETTINGS_TAG);
  cacheLife('hours');
  return getPublicUncached();
}

// Same singleton row, same cache tag — each section just writes its own subset of columns
// through the same upsert, so no section can clobber another's fields.
async function updateSection(
  data: UpdateBusinessInfoInput | UpdateContactInput | UpdateSocialLinksInput | UpdateHeroMediaInput | UpdateSeoInput,
) {
  const row = await siteSettingsRepository.upsert(data);
  // Second arg must match the `cacheLife` profile used in getPublicCached above.
  revalidateTag(SETTINGS_TAG, 'hours');
  return row;
}

export const siteSettingsService = {
  getPublic: getPublicCached,

  // Uncached: feeds the admin settings form pre-fill directly, always fresh for the editor.
  async getAdmin() {
    return siteSettingsRepository.get();
  },

  updateBusinessInfo: (data: UpdateBusinessInfoInput) => updateSection(data),
  updateContact: (data: UpdateContactInput) => updateSection(data),
  updateSocialLinks: (data: UpdateSocialLinksInput) => updateSection(data),
  updateHeroMedia: (data: UpdateHeroMediaInput) => updateSection(data),
  updateSeo: (data: UpdateSeoInput) => updateSection(data),
};
