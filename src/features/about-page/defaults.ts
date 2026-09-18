import type { SiteSettings } from '@/server/db/schema';

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

export const ABOUT_DEFAULTS: AboutContent = {
  heroEyebrow: 'About Vantage Autobody',
  heroLine1: 'Built on',
  heroAccent1: 'Craft',
  heroLine2: 'Driven by',
  heroAccent2: 'Quality',
  heroImagePublicId: null,
  heritageTitle: 'Our Heritage',
  heritageText:
    "Founded in 1998, Vantage Autobody began with a singular obsession: to elevate automotive repair from a trade to a precision craft. What started as a modest two-bay garage specializing in classic restorations has evolved into Ireland's premier high-end collision and repair facility.",
  heritageStat1Value: '1998',
  heritageStat1Label: 'Est.',
  heritageStat2Value: '25+',
  heritageStat2Label: 'Years of Precision',
  heritageImagePublicId: null,
  heritageQuote:
    "We don't just fix cars; we restore the engineering integrity and aesthetic perfection of every vehicle that crosses our threshold.",
  teamTitle: 'The Precision Team',
  teamSubtext:
    'Our facility is only as good as the hands that operate it. We employ master technicians, ATA-accredited painters, and certified chassis alignment specialists.',
  teamMembers: [
    { name: "Declan O'Rourke", role: 'Master Technician', imagePublicId: null },
    { name: 'Siobhan Gallagher', role: 'Lead Refinisher', imagePublicId: null },
    { name: 'Liam Murphy', role: 'Diagnostics & Calibration', imagePublicId: null },
  ],
  standardsEyebrow: 'Facility & Tech',
  standardsTitle: 'Uncompromising\nStandards',
  standardsImagePublicId: null,
  standardsItems: [
    {
      title: 'Laser Chassis Alignment',
      description:
        'Using millimeter-perfect computerized jigs to return structural integrity to factory specifications post-collision.',
    },
    {
      title: 'Climate-Controlled Spray Booths',
      description:
        'Downdraft technology ensures a dust-free environment for flawless, baked-on finishes that match OEM standards perfectly.',
    },
    {
      title: 'NCT Compliant & Insurance Approved',
      description:
        'We work directly with major insurers. All structural repairs guarantee full NCT compliance and roadworthiness.',
    },
  ],
};

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
  const d = ABOUT_DEFAULTS;
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
