import { z } from 'zod';

// Every field is optional and blank-friendly — a section can always be saved with some (or
// all) fields empty. Format constraints (url/email) only kick in once a value is actually
// typed; an empty string always passes.
const optionalUrl = z.union([z.literal(''), z.string().url()]).optional();
const optionalEmail = z.union([z.literal(''), z.string().email()]).optional();
const optionalText = z.union([z.literal(''), z.string()]).optional();
const optionalTextMax = (max: number) => z.union([z.literal(''), z.string().max(max)]).optional();

// Settings is a singleton row edited section-by-section (one Hono route + one form per
// section) — each schema below validates only the columns its section owns.
export const updateBusinessInfoSchema = z.object({
  businessName: optionalTextMax(255),
  openingHours: optionalText,
  address: optionalText,
});

export const updateContactSchema = z.object({
  phone: optionalTextMax(50),
  emergencyPhone: optionalText,
  email: optionalEmail,
  whatsappNumber: optionalText,
  googleMapsUrl: optionalUrl,
});

export const updateSocialLinksSchema = z.object({
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  linkedinUrl: optionalUrl,
});

export const updateHeroMediaSchema = z.object({
  logoPublicId: optionalText,
  faviconPublicId: optionalText,
  heroVideoPublicId: optionalText,
  heroFallbackImagePublicId: optionalText,
  heroVideoEnabled: z.boolean().optional(),
});

export const updateSeoSchema = z.object({
  metaTitle: optionalTextMax(255),
  metaDescription: optionalTextMax(500),
  ogImagePublicId: optionalText,
  twitterHandle: optionalTextMax(50),
});

export const updateHomepageHeroSchema = z.object({
  heroEyebrow: optionalTextMax(200),
  heroHeadlineLine1: optionalTextMax(100),
  heroHeadlineLine2: optionalTextMax(100),
  heroHeadlineAccent: optionalTextMax(100),
  heroSubtext: optionalText,
  trustBadge1Title: optionalTextMax(100),
  trustBadge1Subtitle: optionalTextMax(150),
  trustBadge2Title: optionalTextMax(100),
  trustBadge2Subtitle: optionalTextMax(150),
  trustBadge3Title: optionalTextMax(100),
  trustBadge3Subtitle: optionalTextMax(150),
  trustBadge4Title: optionalTextMax(100),
  trustBadge4Subtitle: optionalTextMax(150),
});

export const updateHomepageCatalogSchema = z.object({
  catalogEyebrow: optionalTextMax(200),
  catalogHeadlineLine1: optionalTextMax(100),
  catalogHeadlineAccent: optionalTextMax(100),
  catalogSubtext: optionalText,
});

// Union of every section — what the repository's upsert accepts, since it only ever
// receives one section's fields at a time.
export const updateSiteSettingsSchema = updateBusinessInfoSchema
  .merge(updateContactSchema)
  .merge(updateSocialLinksSchema)
  .merge(updateHeroMediaSchema)
  .merge(updateSeoSchema)
  .merge(updateHomepageHeroSchema)
  .merge(updateHomepageCatalogSchema);

export type UpdateBusinessInfoInput = z.infer<typeof updateBusinessInfoSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type UpdateSocialLinksInput = z.infer<typeof updateSocialLinksSchema>;
export type UpdateHeroMediaInput = z.infer<typeof updateHeroMediaSchema>;
export type UpdateSeoInput = z.infer<typeof updateSeoSchema>;
export type UpdateHomepageHeroInput = z.infer<typeof updateHomepageHeroSchema>;
export type UpdateHomepageCatalogInput = z.infer<typeof updateHomepageCatalogSchema>;
export type UpdateSiteSettingsInput = z.infer<typeof updateSiteSettingsSchema>;
