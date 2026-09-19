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

export const updateBrandingSchema = z.object({
  logoPublicId: optionalText,
  faviconPublicId: optionalText,
  logoLottieJson: optionalText,
  logoUseLottie: z.boolean().optional(),
});

export const updateHeroMediaSchema = z.object({
  logoPublicId: optionalText,
  faviconPublicId: optionalText,
  logoLottieJson: optionalText,
  logoUseLottie: z.boolean().optional(),
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
  heroFallbackImagePublicId: optionalText,
  heroVideoPublicId: optionalText,
  heroVideoEnabled: z.boolean().optional(),
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

export const updateServicesHeroSchema = z.object({
  servicesHeroEyebrow: optionalTextMax(200),
  servicesHeroHeadlineLine1: optionalTextMax(100),
  servicesHeroHeadlineAccent: optionalTextMax(100),
  servicesHeroSubtext: optionalText,
});

export const updateOurWorkHeroSchema = z.object({
  ourWorkHeroEyebrow: optionalTextMax(200),
  ourWorkHeroHeadlineLine1: optionalTextMax(100),
  ourWorkHeroHeadlineAccent: optionalTextMax(100),
  ourWorkHeroSubtext: optionalText,
});

const insuranceFeatureSchema = z.object({ title: z.string().min(1).max(120), description: z.string().min(1).max(500) });
const insuranceStepSchema = z.object({ label: z.string().min(1).max(80), description: z.string().min(1).max(300) });

export const updateInsurancePageSchema = z.object({
  insuranceHeroEyebrow: optionalTextMax(200),
  insuranceHeroLine1: optionalTextMax(100),
  insuranceHeroLine2: optionalTextMax(100),
  insuranceHeroLine3: optionalTextMax(100),
  insuranceHeroSubtext: optionalText,
  insuranceCoordinationTitle: optionalTextMax(160),
  insuranceCoordinationSubtext: optionalText,
  insuranceFeatures: z.array(insuranceFeatureSchema).max(6).optional(),
  insuranceStepsEyebrow: optionalTextMax(100),
  insuranceStepsTitle: optionalTextMax(160),
  insuranceSteps: z.array(insuranceStepSchema).max(12).optional(),
  insuranceCtaLine1: optionalTextMax(100),
  insuranceCtaAccent: optionalTextMax(100),
  insuranceCtaSubtext: optionalText,
  insuranceDisclaimer: optionalText,
});

const aboutTeamMemberSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  imagePublicId: z.string().max(255).nullable(),
});
const aboutStandardSchema = z.object({ title: z.string().min(1).max(160), description: z.string().min(1).max(500) });

export const updateAboutPageSchema = z.object({
  aboutHeroEyebrow: optionalTextMax(200),
  aboutHeroLine1: optionalTextMax(100),
  aboutHeroAccent1: optionalTextMax(100),
  aboutHeroLine2: optionalTextMax(100),
  aboutHeroAccent2: optionalTextMax(100),
  aboutHeroImagePublicId: optionalTextMax(255),
  aboutHeritageTitle: optionalTextMax(160),
  aboutHeritageText: optionalText,
  aboutHeritageStat1Value: optionalTextMax(40),
  aboutHeritageStat1Label: optionalTextMax(80),
  aboutHeritageStat2Value: optionalTextMax(40),
  aboutHeritageStat2Label: optionalTextMax(80),
  aboutHeritageImagePublicId: optionalTextMax(255),
  aboutHeritageQuote: optionalText,
  aboutTeamTitle: optionalTextMax(160),
  aboutTeamSubtext: optionalText,
  aboutTeamMembers: z.array(aboutTeamMemberSchema).max(12).optional(),
  aboutStandardsEyebrow: optionalTextMax(100),
  aboutStandardsTitle: optionalTextMax(160),
  aboutStandardsImagePublicId: optionalTextMax(255),
  aboutStandardsItems: z.array(aboutStandardSchema).max(6).optional(),
});

export const updateProcessPageSchema = z.object({
  processPageEyebrow: optionalTextMax(200),
  processPageTitle: optionalTextMax(160),
  processPageSubtext: optionalText,
});

// Union of every section — what the repository's upsert accepts, since it only ever
// receives one section's fields at a time.
export const updateSiteSettingsSchema = updateBusinessInfoSchema
  .merge(updateContactSchema)
  .merge(updateSocialLinksSchema)
  .merge(updateBrandingSchema)
  .merge(updateHeroMediaSchema)
  .merge(updateSeoSchema)
  .merge(updateHomepageHeroSchema)
  .merge(updateHomepageCatalogSchema)
  .merge(updateServicesHeroSchema)
  .merge(updateOurWorkHeroSchema)
  .merge(updateInsurancePageSchema)
  .merge(updateAboutPageSchema)
  .merge(updateProcessPageSchema);

export type UpdateBusinessInfoInput = z.infer<typeof updateBusinessInfoSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type UpdateSocialLinksInput = z.infer<typeof updateSocialLinksSchema>;
export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;
export type UpdateHeroMediaInput = z.infer<typeof updateHeroMediaSchema>;
export type UpdateSeoInput = z.infer<typeof updateSeoSchema>;
export type UpdateHomepageHeroInput = z.infer<typeof updateHomepageHeroSchema>;
export type UpdateHomepageCatalogInput = z.infer<typeof updateHomepageCatalogSchema>;
export type UpdateServicesHeroInput = z.infer<typeof updateServicesHeroSchema>;
export type UpdateOurWorkHeroInput = z.infer<typeof updateOurWorkHeroSchema>;
export type UpdateInsurancePageInput = z.infer<typeof updateInsurancePageSchema>;
export type UpdateAboutPageInput = z.infer<typeof updateAboutPageSchema>;
export type UpdateProcessPageInput = z.infer<typeof updateProcessPageSchema>;
export type UpdateSiteSettingsInput = z.infer<typeof updateSiteSettingsSchema>;
