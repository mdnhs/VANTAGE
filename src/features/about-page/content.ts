import { parseGlobal } from '@/lib/content/globals';
import type { PublicImage } from '@/lib/media/public-image';
import type { SiteSettings } from '@/server/db/schema';
import type { PublicSiteSettings } from '@/server/lib/settings/public-settings';

export interface AboutTeamMember {
  name: string;
  role: string;
  imagePublicId: string | null;
}

export interface AboutStandard {
  title: string;
  description: string;
}

export interface AboutContent {
  heroEyebrow: string;
  heroLine1: string;
  heroAccent1: string;
  heroLine2: string;
  heroAccent2: string;
  heroImagePublicId: string | null;
  heritageTitle: string;
  heritageText: string;
  heritageStat1Value: string;
  heritageStat1Label: string;
  heritageStat2Value: string;
  heritageStat2Label: string;
  heritageImagePublicId: string | null;
  heritageQuote: string;
  teamTitle: string;
  teamSubtext: string;
  teamMembers: AboutTeamMember[];
  standardsEyebrow: string;
  standardsTitle: string;
  standardsImagePublicId: string | null;
  standardsItems: AboutStandard[];
}

// Bundled photos shown while a CMS image slot is still empty.
export const ABOUT_FALLBACK_IMAGES = {
  hero: '/assets/marketing/about-hero.jpg',
  heritage: '/assets/marketing/about-heritage.jpg',
  standards: '/assets/marketing/about-standards.jpg',
  team: [
    '/assets/marketing/profile.jpg',
    '/assets/marketing/about-team-siobhan.jpg',
    '/assets/marketing/about-team-liam.jpg',
  ],
} as const;

// The design copy lives in the page.about schema (src/lib/content/globals-*.ts); this reads it.
function aboutDefaults(): AboutContent {
  const a = parseGlobal('page.about', undefined);
  return {
    heroEyebrow: a.hero.eyebrow,
    heroLine1: a.hero.line1,
    heroAccent1: a.hero.accent1,
    heroLine2: a.hero.line2,
    heroAccent2: a.hero.accent2,
    heroImagePublicId: null,
    heritageTitle: a.heritage.title,
    heritageText: a.heritage.text,
    heritageStat1Value: a.heritage.stat1.value,
    heritageStat1Label: a.heritage.stat1.label,
    heritageStat2Value: a.heritage.stat2.value,
    heritageStat2Label: a.heritage.stat2.label,
    heritageImagePublicId: null,
    heritageQuote: a.heritage.quote,
    teamTitle: a.team.title,
    teamSubtext: a.team.subtext,
    teamMembers: a.team.members.map((m) => ({ name: m.name, role: m.role, imagePublicId: null })),
    standardsEyebrow: a.standards.eyebrow,
    standardsTitle: a.standards.title,
    standardsImagePublicId: null,
    standardsItems: a.standards.items,
  };
}

type AboutKeys =
  | 'aboutHeroEyebrow'
  | 'aboutHeroLine1'
  | 'aboutHeroAccent1'
  | 'aboutHeroLine2'
  | 'aboutHeroAccent2'
  | 'aboutHeroImagePublicId'
  | 'aboutHeritageTitle'
  | 'aboutHeritageText'
  | 'aboutHeritageStat1Value'
  | 'aboutHeritageStat1Label'
  | 'aboutHeritageStat2Value'
  | 'aboutHeritageStat2Label'
  | 'aboutHeritageImagePublicId'
  | 'aboutHeritageQuote'
  | 'aboutTeamTitle'
  | 'aboutTeamSubtext'
  | 'aboutTeamMembers'
  | 'aboutStandardsEyebrow'
  | 'aboutStandardsTitle'
  | 'aboutStandardsImagePublicId'
  | 'aboutStandardsItems';

type AboutSource = Partial<Pick<SiteSettings, AboutKeys>>;

// Blank/unset columns fall back to the design copy so the page never renders empty.
export function resolveAboutContent(s: (AboutSource & object) | null | undefined): AboutContent {
  const d = aboutDefaults();
  return {
    heroEyebrow: s?.aboutHeroEyebrow || d.heroEyebrow,
    heroLine1: s?.aboutHeroLine1 || d.heroLine1,
    heroAccent1: s?.aboutHeroAccent1 || d.heroAccent1,
    heroLine2: s?.aboutHeroLine2 || d.heroLine2,
    heroAccent2: s?.aboutHeroAccent2 || d.heroAccent2,
    heroImagePublicId: s?.aboutHeroImagePublicId || null,
    heritageTitle: s?.aboutHeritageTitle || d.heritageTitle,
    heritageText: s?.aboutHeritageText || d.heritageText,
    heritageStat1Value: s?.aboutHeritageStat1Value || d.heritageStat1Value,
    heritageStat1Label: s?.aboutHeritageStat1Label || d.heritageStat1Label,
    heritageStat2Value: s?.aboutHeritageStat2Value || d.heritageStat2Value,
    heritageStat2Label: s?.aboutHeritageStat2Label || d.heritageStat2Label,
    heritageImagePublicId: s?.aboutHeritageImagePublicId || null,
    heritageQuote: s?.aboutHeritageQuote || d.heritageQuote,
    teamTitle: s?.aboutTeamTitle || d.teamTitle,
    teamSubtext: s?.aboutTeamSubtext || d.teamSubtext,
    teamMembers: s?.aboutTeamMembers?.length ? s.aboutTeamMembers : d.teamMembers,
    standardsEyebrow: s?.aboutStandardsEyebrow || d.standardsEyebrow,
    standardsTitle: s?.aboutStandardsTitle || d.standardsTitle,
    standardsImagePublicId: s?.aboutStandardsImagePublicId || null,
    standardsItems: s?.aboutStandardsItems?.length ? s.aboutStandardsItems : d.standardsItems,
  };
}

export interface AboutPageTeamMember {
  name: string;
  role: string;
  image: PublicImage | null;
}

// What the public About page renders: the same copy, with each photo as a ready PublicImage.
export interface AboutPageContent extends Omit<
  AboutContent,
  'heroImagePublicId' | 'heritageImagePublicId' | 'standardsImagePublicId' | 'teamMembers'
> {
  heroImage: PublicImage | null;
  heritageImage: PublicImage | null;
  standardsImage: PublicImage | null;
  teamMembers: AboutPageTeamMember[];
}

export function resolveAboutPageContent(
  s: Pick<PublicSiteSettings, 'aboutHeroImage' | 'aboutHeritageImage' | 'aboutStandardsImage' | 'aboutTeamMembers'> &
    Partial<Pick<SiteSettings, Exclude<AboutKeys, 'aboutTeamMembers'>>>,
): AboutPageContent {
  const {
    heroImagePublicId: _hero,
    heritageImagePublicId: _heritage,
    standardsImagePublicId: _standards,
    teamMembers: _team,
    ...copy
  } = resolveAboutContent({ ...s, aboutTeamMembers: null });
  return {
    ...copy,
    heroImage: s.aboutHeroImage,
    heritageImage: s.aboutHeritageImage,
    standardsImage: s.aboutStandardsImage,
    teamMembers: s.aboutTeamMembers.length
      ? s.aboutTeamMembers
      : aboutDefaults().teamMembers.map((m) => ({ name: m.name, role: m.role, image: null })),
  };
}
