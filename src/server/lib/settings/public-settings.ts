import { formatOpeningHoursSummary, type DaySchedule } from '@/lib/content/opening-hours';
import type { GlobalValue } from '@/lib/content/globals';
import type { ImageRef } from '@/lib/content/image-ref';
import type { PublicImage } from '@/lib/media/public-image';
import type { SiteSettings } from '@/server/db/schema';
import { toPublicImage } from '@/server/lib/media/resolve';

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

// What public pages read: the legacy flat shape with every image column replaced by a
// ready-to-render PublicImage (R2 row, or the legacy Cloudinary URL until Phase 11).
export type PublicSiteSettings = Omit<LegacySiteView, (typeof LEGACY_IMAGE_COLUMNS)[number]> & {
  logo: PublicImage | null;
  favicon: PublicImage | null;
  heroVideo: PublicImage | null;
  heroFallbackImage: PublicImage | null;
  ogImage: PublicImage | null;
  aboutHeroImage: PublicImage | null;
  aboutHeritageImage: PublicImage | null;
  aboutStandardsImage: PublicImage | null;
  aboutTeamMembers: PublicTeamMember[];
};

// What the public site showed before any row existed (footer.tsx / hero-section.tsx / header.tsx).
export const FALLBACK_SETTINGS = {
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
  logoLottieJson: null,
  logoUseLottie: false,
  heroVideoPublicId: null,
  heroFallbackImagePublicId: null,
  heroVideoEnabled: false,
  metaTitle: null,
  metaDescription: null,
  ogImagePublicId: null,
  twitterHandle: null,
  heroEyebrow: "Ireland's Premier Collision & Respray Specialists",
  heroHeadlineLine1: 'We Restore',
  heroHeadlineLine2: 'Your Car',
  heroHeadlineAccent: 'To Its Best.',
  heroSubtext:
    'Manufacturer-standard accident repair, computerized laser chassis realignment, certified spray painting, and bespoke automotive restoration in Dublin. Your vehicle, our obsession.',
  trustBadge1Title: '4.9★ Google Rated',
  trustBadge1Subtitle: '180+ Dublin Reviews',
  trustBadge2Title: 'Direct Insurer Billing',
  trustBadge2Subtitle: 'AXA, Allianz, Zurich',
  trustBadge3Title: 'Lifetime Paint Warranty',
  trustBadge3Subtitle: 'Standox & PPG Systems',
  trustBadge4Title: 'Courtesy Replacement',
  trustBadge4Subtitle: 'Cars Available On-Site',
  catalogEyebrow: 'Specialist Autobody Divisions',
  catalogHeadlineLine1: 'From Damage To',
  catalogHeadlineAccent: 'Showroom Finish.',
  catalogSubtext:
    'Comprehensive automotive bodywork, structural restoration, and cosmetic refinement using factory-approved techniques.',
  servicesHeroEyebrow: 'Master Craftsmanship',
  servicesHeroHeadlineLine1: 'Professional Bodywork.',
  servicesHeroHeadlineAccent: 'Precision Finish.',
  servicesHeroSubtext:
    'Our specialized services are engineered to restore your vehicle to factory perfection or elevate it beyond original specifications.',
  ourWorkHeroEyebrow: 'Portfolio',
  ourWorkHeroHeadlineLine1: 'Our Recent',
  ourWorkHeroHeadlineAccent: 'Restorations.',
  ourWorkHeroSubtext:
    'Explore a curated selection of our most challenging and rewarding projects. Precision engineering meets master craftsmanship.',
} as const;

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
// becomes its legacy URL until Phase 11.
function resolveRef(
  ref: ImageRef,
  images: Record<string, PublicImage>,
  resourceType: 'image' | 'video' = 'image',
): PublicImage | null {
  if (!ref) return null;
  if (ref.kind === 'media') return images[ref.id.toLowerCase()] ?? null;
  return toPublicImage(null, { publicId: ref.publicId, resourceType });
}

export function composePublicSettings(g: PublicGlobals, images: Record<string, PublicImage>): PublicSiteSettings {
  const flat = composeLegacyView(g);
  const rest = Object.fromEntries(
    Object.entries(flat).filter(([k]) => !(LEGACY_IMAGE_COLUMNS as readonly string[]).includes(k)),
  ) as Omit<LegacySiteView, (typeof LEGACY_IMAGE_COLUMNS)[number]>;
  const about = g['page.about'];
  return {
    ...rest,
    logo: resolveRef(g.site.logo, images),
    favicon: resolveRef(g.site.favicon, images),
    heroVideo: resolveRef(g['page.home'].hero.video, images, 'video'),
    heroFallbackImage: resolveRef(g['page.home'].hero.fallbackImage, images),
    ogImage: resolveRef(g.seo.defaultOgImage, images),
    aboutHeroImage: resolveRef(about.hero.image, images),
    aboutHeritageImage: resolveRef(about.heritage.image, images),
    aboutStandardsImage: resolveRef(about.standards.image, images),
    aboutTeamMembers: about.team.members
      .filter((m) => m.name.trim())
      .map((m) => ({ name: m.name, role: m.role, image: resolveRef(m.image, images) })),
  };
}
