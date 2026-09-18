import { z } from 'zod';

// Allow empty string for URL-ish fields so a form can clear a field without sending null
// (the client always sends strings; empty string clears it in the repository layer).
const optionalUrl = z.union([z.literal(''), z.string().url()]).optional();
const optionalText = z.union([z.literal(''), z.string()]).optional();

export const updateSiteSettingsSchema = z.object({
  businessName: z.string().min(1).max(255).optional(),
  phone: z.string().min(1).max(50).optional(),
  emergencyPhone: optionalText,
  email: z.string().email().optional(),
  address: z.string().min(1).optional(),
  openingHours: z.string().min(1).optional(),
  googleMapsUrl: optionalUrl,
  whatsappNumber: optionalText,
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  logoPublicId: optionalText,
  faviconPublicId: optionalText,
  heroVideoPublicId: optionalText,
  heroFallbackImagePublicId: optionalText,
  heroVideoEnabled: z.boolean().optional(),
});

export type UpdateSiteSettingsInput = z.infer<typeof updateSiteSettingsSchema>;
