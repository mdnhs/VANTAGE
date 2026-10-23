// Frozen copy of the pre-Task-6 literals (src/features/*-page/defaults.ts and FALLBACK_SETTINGS
// at 00182c2). Tests compare the schema defaults against these so the public copy cannot drift.
import type { AboutContent } from '@/features/about-page/content';
import type { InsuranceContent } from '@/features/insurance-page/content';

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

export const INSURANCE_DEFAULTS: InsuranceContent = {
  heroEyebrow: 'Insurance Claims',
  heroLine1: 'Accident Repair',
  heroLine2: 'Without The',
  heroLine3: 'Headache.',
  heroSubtext:
    'We handle the paperwork, the assessors, and the exact precision repairs. Focus on getting back on the road while our dedicated specialists coordinate seamlessly with your insurance provider.',
  coordinationTitle: 'Seamless Coordination',
  coordinationSubtext:
    'Our concierge-level claims service is designed to eliminate friction at every step of the repair journey.',
  features: [
    {
      title: 'Direct Insurer Communication',
      description:
        'We bypass the middleman, speaking directly with loss adjusters and assessors to approve your claim faster using specialized industry channels.',
    },
    {
      title: 'Courtesy Car Coordination',
      description:
        'Never be left stranded. We arrange premium replacement vehicles immediately while yours is undergoing its comprehensive restoration.',
    },
    {
      title: 'Transparent Estimates',
      description:
        'Blueprint-level breakdowns of parts, labor, and paint. Total clarity for you and unarguable technical justification for the insurer.',
    },
  ],
  stepsEyebrow: 'The Methodology',
  stepsTitle: '7 Steps to Perfection',
  steps: [
    { label: 'Report', description: 'Drop off your vehicle or let us recover it securely to our facility.' },
    { label: 'Insurer Contact', description: 'We open the dialogue with your provider to establish the claim.' },
    { label: 'Assessment', description: '3D laser scanning and structural diagnostics form a complete blueprint.' },
    { label: 'Approval', description: 'Technical justification secures rapid, uncompromised authorization.' },
    { label: 'Repair', description: 'Our master technicians execute precision bodywork and flawless respraying.' },
    { label: 'Quality Control', description: 'Micron-level paint depth checks and strict safety calibrations.' },
    { label: 'Return', description: 'Vehicle handed back fully valeted, certified, and guaranteed.' },
  ],
  ctaLine1: 'Ready to Hand Over',
  ctaAccent: 'The Keys?',
  ctaSubtext:
    "Connect with our claims team. We'll outline your options in five minutes and set the gears in motion immediately.",
  disclaimer:
    "Disclaimer: courtesy vehicle provision is subject to availability and your specific insurance policy terms. Vantage Autobody operates independently and is legally entitled to repair vehicles insured by all major providers under the 'Right to Choose' directive. Terms and conditions apply.",
};

export const PROCESS_PAGE_DEFAULTS = {
  eyebrow: 'Predictable & Certified Workflow',
  title: 'The {count}-Step Vantage Standard',
  subtext: 'From initial digital triage to strict multi-point handoff inspection, every step is transparently logged.',
};

export const LEGACY_FALLBACK_SETTINGS = {
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
