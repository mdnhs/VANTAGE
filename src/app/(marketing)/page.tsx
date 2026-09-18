import type { Metadata } from 'next';
import { StitchHero } from '@/components/marketing/stitch-hero';
import { StitchPillars } from '@/components/marketing/stitch-pillars';
import { StitchServices } from '@/components/marketing/stitch-services';
import { StitchEstimator } from '@/components/marketing/stitch-estimator';
import { StitchCaseStudies } from '@/components/marketing/stitch-case-studies';
import { StitchProcess } from '@/components/marketing/stitch-process';
import { StitchSocialProof } from '@/components/marketing/stitch-social-proof';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { testimonialService } from '@/server/services/testimonial-service';
import { partnerLogoService } from '@/server/services/partner-logo-service';
import { homepagePillarService } from '@/server/services/homepage-pillar-service';
import { homepageCatalogService } from '@/server/services/homepage-catalog-service';
import { homepageProcessStepService } from '@/server/services/homepage-process-step-service';
import { projectService } from '@/server/services/project-service';

const DESCRIPTION =
  'Ireland’s premier automotive crash repair, precision chassis reconstruction, laser alignment, and high-end vehicle restoration center in Dublin. OEM certified and insurer approved.';

// Homepage puts the business name first (absolute title, bypassing the root layout's
// "%s | {businessName}" template) so it's still visible when a browser tab truncates
// the title — every other page keeps the template's page-name-first order.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await siteSettingsService.getPublic();
  const description = settings.metaDescription || DESCRIPTION;

  return {
    title: { absolute: `${settings.businessName} — Precision Crash Repair & Restoration Dublin` },
    description,
    alternates: { canonical: '/' },
  };
}

export default async function Home() {
  const [settings, catalogItems, testimonials, partnerLogos, pillars, processSteps, featuredProjects] =
    await Promise.all([
      siteSettingsService.getPublic(),
      homepageCatalogService.listEnabled(),
      testimonialService.listFeatured(),
      partnerLogoService.listEnabled(),
      homepagePillarService.listEnabled(),
      homepageProcessStepService.listEnabled(),
      projectService.listFeatured(),
    ]);

  const trustItems = [
    { title: settings.trustBadge1Title ?? '', subtitle: settings.trustBadge1Subtitle ?? '' },
    { title: settings.trustBadge2Title ?? '', subtitle: settings.trustBadge2Subtitle ?? '' },
    { title: settings.trustBadge3Title ?? '', subtitle: settings.trustBadge3Subtitle ?? '' },
    { title: settings.trustBadge4Title ?? '', subtitle: settings.trustBadge4Subtitle ?? '' },
  ];

  return (
    <div className='flex min-h-screen flex-col bg-[#0d0d0d] text-[#e5e2e1] antialiased selection:bg-[#dc2626] selection:text-white'>
      <main className='grow'>
        <StitchHero
          heroVideoEnabled={settings.heroVideoEnabled}
          heroVideoPublicId={settings.heroVideoPublicId}
          heroFallbackImagePublicId={settings.heroFallbackImagePublicId}
          eyebrow={settings.heroEyebrow}
          headlineLine1={settings.heroHeadlineLine1}
          headlineLine2={settings.heroHeadlineLine2}
          headlineAccent={settings.heroHeadlineAccent}
          subtext={settings.heroSubtext}
          trustItems={trustItems}
        />
        <StitchPillars pillars={pillars} />
        <StitchServices
          catalogItems={catalogItems}
          eyebrow={settings.catalogEyebrow}
          headlineLine1={settings.catalogHeadlineLine1}
          headlineAccent={settings.catalogHeadlineAccent}
          subtext={settings.catalogSubtext}
        />
        <StitchEstimator />
        <StitchCaseStudies projects={featuredProjects} />
        <StitchProcess steps={processSteps} />
        <StitchSocialProof testimonials={testimonials} partnerLogos={partnerLogos} />
      </main>
    </div>
  );
}
