import { formatOpeningHoursSummary, type DaySchedule } from '@/lib/content/opening-hours';
import { parseGlobal, type GlobalValue } from '@/lib/content/globals';
import type { ImageRef } from '@/lib/content/image-ref';
import { telHref } from '@/lib/content/phone';
import type { PublicImage } from '@/lib/media/public-image';
import type { SiteSettings } from '@/server/db/schema';

// Turns the versioned setting documents into the flat shape the
// public site was built against (`site_settings` columns), so marketing components keep
// their props. Phase 11 retires this shape together with the legacy table.

export const PUBLIC_SETTINGS_KEYS = [
  'site',
  'contact',
  'seo',
  'page.home',
  'page.services',
  'page.our-work',
  'page.insurance',
  'page.about',
  'page.process',
] as const;
export type PublicSettingsKey = (typeof PUBLIC_SETTINGS_KEYS)[number];

export type PublicGlobals = { [K in PublicSettingsKey]: GlobalValue<K> };

// Every public document at its schema defaults: the single source of the site's built-in copy.
export function defaultPublicGlobals(): PublicGlobals {
  return Object.fromEntries(PUBLIC_SETTINGS_KEYS.map((k) => [k, parseGlobal(k, undefined)])) as PublicGlobals;
}

// The flat shape the site was built against, image columns still as Cloudinary public ids.
// Kept for the Phase 4 migration verifier (it compares against the legacy row).
export type LegacySiteView = Omit<SiteSettings, 'id' | 'updatedAt'>;

const LEGACY_IMAGE_COLUMNS = [
  'logoPublicId',
  'faviconPublicId',
  'heroVideoPublicId',
  'heroFallbackImagePublicId',
  'ogImagePublicId',
  'aboutHeroImagePublicId',
  'aboutHeritageImagePublicId',
  'aboutStandardsImagePublicId',
  'aboutTeamMembers',
] as const;

export type PublicTeamMember = { name: string; role: string; image: PublicImage | null };

export type PublicSiteSettings = {
  businessName: string;
  phone: string;
  phoneHref: string;
  emergencyPhone: string | null;
  email: string;
  address: string;
  openingHours: string;
  googleMapsUrl: string | null;
  whatsappNumber: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  linkedinUrl: string | null;
  logo: PublicImage | null;
  favicon: PublicImage | null;
  logoLottieJson: string | null;
  logoUseLottie: boolean;
  heroVideo: PublicImage | null;
  heroFallbackImage: PublicImage | null;
  heroVideoEnabled: boolean;
  heroEyebrow: string | null;
  heroHeadlineLine1: string | null;
  heroHeadlineLine2: string | null;
  heroHeadlineAccent: string | null;
  heroSubtext: string | null;
  trustBadge1Title: string | null;
  trustBadge1Subtitle: string | null;
  trustBadge2Title: string | null;
  trustBadge2Subtitle: string | null;
  trustBadge3Title: string | null;
  trustBadge3Subtitle: string | null;
  trustBadge4Title: string | null;
  trustBadge4Subtitle: string | null;
  catalogEyebrow: string | null;
  catalogHeadlineLine1: string | null;
  catalogHeadlineAccent: string | null;
  catalogSubtext: string | null;
  servicesHeroEyebrow: string | null;
  servicesHeroHeadlineLine1: string | null;
  servicesHeroHeadlineAccent: string | null;
  servicesHeroSubtext: string | null;
  ourWorkHeroEyebrow: string | null;
  ourWorkHeroHeadlineLine1: string | null;
  ourWorkHeroHeadlineAccent: string | null;
  ourWorkHeroSubtext: string | null;
  insuranceHeroEyebrow: string | null;
  insuranceHeroLine1: string | null;
  insuranceHeroLine2: string | null;
  insuranceHeroLine3: string | null;
  insuranceHeroSubtext: string | null;
  insuranceCoordinationTitle: string | null;
  insuranceCoordinationSubtext: string | null;
  insuranceFeatures: { title: string; description: string }[] | null;
  insuranceStepsEyebrow: string | null;
  insuranceStepsTitle: string | null;
  insuranceSteps: { label: string; description: string }[] | null;
  insuranceCtaLine1: string | null;
  insuranceCtaAccent: string | null;
  insuranceCtaSubtext: string | null;
  insuranceDisclaimer: string | null;
  aboutHeroEyebrow: string | null;
  aboutHeroLine1: string | null;
  aboutHeroAccent1: string | null;
  aboutHeroLine2: string | null;
  aboutHeroAccent2: string | null;
  aboutHeroImage: PublicImage | null;
  aboutHeritageTitle: string | null;
  aboutHeritageText: string | null;
  aboutHeritageStat1Value: string | null;
  aboutHeritageStat1Label: string | null;
  aboutHeritageStat2Value: string | null;
  aboutHeritageStat2Label: string | null;
  aboutHeritageImage: PublicImage | null;
  aboutHeritageQuote: string | null;
  aboutTeamTitle: string | null;
  aboutTeamSubtext: string | null;
  aboutTeamMembers: PublicTeamMember[];
  aboutStandardsEyebrow: string | null;
  aboutStandardsTitle: string | null;
  aboutStandardsImage: PublicImage | null;
  aboutStandardsItems: { title: string; description: string }[] | null;
  processPageEyebrow: string | null;
  processPageTitle: string | null;
  processPageSubtext: string | null;
};

// Only Cloudinary refs have a public id.
const publicId = (ref: ImageRef) => (ref?.kind === 'cloudinary' ? ref.publicId : null);
const orNull = (v: string) => v.trim() || null;

const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

// The hours text the site prints: the editor's summary, or one built from the weekly rows.
function hoursText(hours: PublicGlobals['contact']['hours']): string {
  if (hours.summary.trim()) return hours.summary;
  if (hours.weekly.length === 0) return '';
  const schedule: DaySchedule[] = FULL_DAYS.map((day, i) => {
    const row = hours.weekly.find((r) => r.days.includes(i + 1));
    return {
      day,
      shortDay: SHORT_DAYS[i]!,
      isOpen: !!row,
      openTime: row?.opens ?? '09:00',
      closeTime: row?.closes ?? '14:00',
    };
  });
  return formatOpeningHoursSummary(schedule);
}

export function composeLegacyView(g: PublicGlobals): LegacySiteView {
  const { site, contact, seo } = g;
  const home = g['page.home'];
  const services = g['page.services'];
  const ourWork = g['page.our-work'];
  const insurance = g['page.insurance'];
  const about = g['page.about'];
  const process = g['page.process'];

  const social = (label: string) => site.social.find((s) => s.label.trim().toLowerCase() === label)?.url ?? null;
  const address = [...contact.address.lines, contact.address.city, contact.address.eircode, contact.address.country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
  const openingHours = hoursText(contact.hours);

  // An SEO value equal to what the site derives anyway is "not overridden" (null).
  const derivedDescription = `${site.name} — ${formatOpeningHoursSummary(openingHours)}`;
  const badge = (i: number) => home.trustBadges[i] ?? { title: '', subtitle: '' };

  return {
    businessName: site.name,
    phone: contact.phone.display,
    emergencyPhone: orNull(contact.emergencyPhone),
    email: contact.email,
    address,
    openingHours,
    googleMapsUrl: orNull(contact.mapUrl),
    whatsappNumber: orNull(contact.whatsapp),
    facebookUrl: social('facebook'),
    instagramUrl: social('instagram'),
    tiktokUrl: social('tiktok'),
    linkedinUrl: social('linkedin'),
    logoPublicId: publicId(site.logo),
    faviconPublicId: publicId(site.favicon),
    logoLottieJson: site.lottieLogo.json,
    logoUseLottie: site.lottieLogo.enabled,
    heroVideoPublicId: publicId(home.hero.video),
    heroFallbackImagePublicId: publicId(home.hero.fallbackImage),
    heroVideoEnabled: home.hero.videoEnabled,
    metaTitle: seo.defaultTitle.trim() && seo.defaultTitle.trim() !== site.name ? seo.defaultTitle : null,
    metaDescription:
      seo.defaultDescription.trim() && seo.defaultDescription !== derivedDescription ? seo.defaultDescription : null,
    ogImagePublicId: publicId(seo.defaultOgImage),
    twitterHandle: orNull(seo.twitterHandle),
    heroEyebrow: home.hero.eyebrow,
    heroHeadlineLine1: home.hero.line1,
    heroHeadlineLine2: home.hero.line2,
    heroHeadlineAccent: home.hero.accent,
    heroSubtext: home.hero.subtext,
    trustBadge1Title: badge(0).title,
    trustBadge1Subtitle: badge(0).subtitle,
    trustBadge2Title: badge(1).title,
    trustBadge2Subtitle: badge(1).subtitle,
    trustBadge3Title: badge(2).title,
    trustBadge3Subtitle: badge(2).subtitle,
    trustBadge4Title: badge(3).title,
    trustBadge4Subtitle: badge(3).subtitle,
    catalogEyebrow: home.catalog.eyebrow,
    catalogHeadlineLine1: home.catalog.line1,
    catalogHeadlineAccent: home.catalog.accent,
    catalogSubtext: home.catalog.subtext,
    servicesHeroEyebrow: services.hero.eyebrow,
    servicesHeroHeadlineLine1: services.hero.line1,
    servicesHeroHeadlineAccent: services.hero.accent,
    servicesHeroSubtext: services.hero.subtext,
    ourWorkHeroEyebrow: ourWork.hero.eyebrow,
    ourWorkHeroHeadlineLine1: ourWork.hero.line1,
    ourWorkHeroHeadlineAccent: ourWork.hero.accent,
    ourWorkHeroSubtext: ourWork.hero.subtext,
    insuranceHeroEyebrow: insurance.hero.eyebrow,
    insuranceHeroLine1: insurance.hero.line1,
    insuranceHeroLine2: insurance.hero.line2,
    insuranceHeroLine3: insurance.hero.line3,
    insuranceHeroSubtext: insurance.hero.subtext,
    insuranceCoordinationTitle: insurance.coordination.title,
    insuranceCoordinationSubtext: insurance.coordination.subtext,
    insuranceFeatures: insurance.coordination.features.filter((f) => f.title.trim()),
    insuranceStepsEyebrow: insurance.steps.eyebrow,
    insuranceStepsTitle: insurance.steps.title,
    insuranceSteps: insurance.steps.items.filter((i) => i.label.trim()),
    insuranceCtaLine1: insurance.cta.line1,
    insuranceCtaAccent: insurance.cta.accent,
    insuranceCtaSubtext: insurance.cta.subtext,
    insuranceDisclaimer: insurance.disclaimer,
    aboutHeroEyebrow: about.hero.eyebrow,
    aboutHeroLine1: about.hero.line1,
    aboutHeroAccent1: about.hero.accent1,
    aboutHeroLine2: about.hero.line2,
    aboutHeroAccent2: about.hero.accent2,
    aboutHeroImagePublicId: publicId(about.hero.image),
    aboutHeritageTitle: about.heritage.title,
    aboutHeritageText: about.heritage.text,
    aboutHeritageStat1Value: about.heritage.stat1.value,
    aboutHeritageStat1Label: about.heritage.stat1.label,
    aboutHeritageStat2Value: about.heritage.stat2.value,
    aboutHeritageStat2Label: about.heritage.stat2.label,
    aboutHeritageImagePublicId: publicId(about.heritage.image),
    aboutHeritageQuote: about.heritage.quote,
    aboutTeamTitle: about.team.title,
    aboutTeamSubtext: about.team.subtext,
    aboutTeamMembers: about.team.members
      .filter((m) => m.name.trim())
      .map((m) => ({ name: m.name, role: m.role, imagePublicId: publicId(m.image) })),
    aboutStandardsEyebrow: about.standards.eyebrow,
    aboutStandardsTitle: about.standards.title,
    aboutStandardsImagePublicId: publicId(about.standards.image),
    aboutStandardsItems: about.standards.items.filter((i) => i.title.trim()),
    processPageEyebrow: process.eyebrow,
    processPageTitle: process.title,
    processPageSubtext: process.subtext,
  };
}

// A media ref reads the preloaded row (missing or soft-deleted: no image); a Cloudinary ref
// resolves to null.
function resolveRef(ref: ImageRef, images: Record<string, PublicImage>): PublicImage | null {
  if (!ref || ref.kind === 'cloudinary') return null;
  if (ref.kind === 'media') return images[ref.id.toLowerCase()] ?? null;
  return null;
}

const EXCLUDED_FROM_PUBLIC = [...LEGACY_IMAGE_COLUMNS, 'metaTitle', 'metaDescription', 'twitterHandle'] as const;

export function composePublicSettings(g: PublicGlobals, images: Record<string, PublicImage>): PublicSiteSettings {
  const flat = composeLegacyView(g);
  const rest = Object.fromEntries(
    Object.entries(flat).filter(([k]) => !(EXCLUDED_FROM_PUBLIC as readonly string[]).includes(k)),
  ) as Omit<LegacySiteView, (typeof EXCLUDED_FROM_PUBLIC)[number]>;
  const about = g['page.about'];
  return {
    ...rest,
    phoneHref: telHref(g.contact.phone.display, g.contact.phone.e164),
    logo: resolveRef(g.site.logo, images),
    favicon: resolveRef(g.site.favicon, images),
    heroVideo: resolveRef(g['page.home'].hero.video, images),
    heroFallbackImage: resolveRef(g['page.home'].hero.fallbackImage, images),
    aboutHeroImage: resolveRef(about.hero.image, images),
    aboutHeritageImage: resolveRef(about.heritage.image, images),
    aboutStandardsImage: resolveRef(about.standards.image, images),
    aboutTeamMembers: about.team.members
      .filter((m) => m.name.trim())
      .map((m) => ({ name: m.name, role: m.role, image: resolveRef(m.image, images) })),
  };
}

// What the public site showed before any row existed (footer.tsx / hero-section.tsx / header.tsx),
// derived from the schema defaults rather than kept as a second copy.
const FALLBACK_KEYS = [
  'businessName',
  'phone',
  'emergencyPhone',
  'email',
  'address',
  'openingHours',
  'googleMapsUrl',
  'whatsappNumber',
  'facebookUrl',
  'instagramUrl',
  'tiktokUrl',
  'linkedinUrl',
  'logoPublicId',
  'faviconPublicId',
  'logoLottieJson',
  'logoUseLottie',
  'heroVideoPublicId',
  'heroFallbackImagePublicId',
  'heroVideoEnabled',
  'metaTitle',
  'metaDescription',
  'ogImagePublicId',
  'twitterHandle',
  'heroEyebrow',
  'heroHeadlineLine1',
  'heroHeadlineLine2',
  'heroHeadlineAccent',
  'heroSubtext',
  'trustBadge1Title',
  'trustBadge1Subtitle',
  'trustBadge2Title',
  'trustBadge2Subtitle',
  'trustBadge3Title',
  'trustBadge3Subtitle',
  'trustBadge4Title',
  'trustBadge4Subtitle',
  'catalogEyebrow',
  'catalogHeadlineLine1',
  'catalogHeadlineAccent',
  'catalogSubtext',
  'servicesHeroEyebrow',
  'servicesHeroHeadlineLine1',
  'servicesHeroHeadlineAccent',
  'servicesHeroSubtext',
  'ourWorkHeroEyebrow',
  'ourWorkHeroHeadlineLine1',
  'ourWorkHeroHeadlineAccent',
  'ourWorkHeroSubtext',
] as const satisfies readonly (keyof LegacySiteView)[];

const defaultView = composeLegacyView(defaultPublicGlobals());
export const FALLBACK_SETTINGS = Object.fromEntries(FALLBACK_KEYS.map((k) => [k, defaultView[k]])) as Pick<
  LegacySiteView,
  (typeof FALLBACK_KEYS)[number]
>;
