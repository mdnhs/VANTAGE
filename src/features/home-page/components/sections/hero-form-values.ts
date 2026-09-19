import type { SiteSettings, UpdateHomepageHeroInput } from '@/features/site-settings/types';

export type HeroFormValues = UpdateHomepageHeroInput;

export function toHeroFormValues(data: SiteSettings | null): HeroFormValues {
  return {
    heroEyebrow: data?.heroEyebrow ?? '',
    heroHeadlineLine1: data?.heroHeadlineLine1 ?? '',
    heroHeadlineLine2: data?.heroHeadlineLine2 ?? '',
    heroHeadlineAccent: data?.heroHeadlineAccent ?? '',
    heroSubtext: data?.heroSubtext ?? '',
    heroFallbackImagePublicId: data?.heroFallbackImagePublicId ?? '',
    heroVideoPublicId: data?.heroVideoPublicId ?? '',
    heroVideoEnabled: data?.heroVideoEnabled ?? false,
    trustBadge1Title: data?.trustBadge1Title ?? '',
    trustBadge1Subtitle: data?.trustBadge1Subtitle ?? '',
    trustBadge2Title: data?.trustBadge2Title ?? '',
    trustBadge2Subtitle: data?.trustBadge2Subtitle ?? '',
    trustBadge3Title: data?.trustBadge3Title ?? '',
    trustBadge3Subtitle: data?.trustBadge3Subtitle ?? '',
    trustBadge4Title: data?.trustBadge4Title ?? '',
    trustBadge4Subtitle: data?.trustBadge4Subtitle ?? '',
  };
}
