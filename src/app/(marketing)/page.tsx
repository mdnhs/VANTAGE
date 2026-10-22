import { getPageMetadata } from '@/server/queries/get-page-seo';
import { PageJsonLd } from '@/components/seo/page-json-ld';
import { StitchHero } from '@/components/marketing/stitch-hero';
import { StitchServices } from '@/components/marketing/stitch-services';
import { StitchEstimator } from '@/components/marketing/stitch-estimator';
import { StitchCaseStudies } from '@/components/marketing/stitch-case-studies';
import { StitchProcess } from '@/components/marketing/stitch-process';
import { StitchSocialProof } from '@/components/marketing/stitch-social-proof';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { testimonialService } from '@/server/services/testimonial-service';
import { partnerLogoService } from '@/server/services/partner-logo-service';
import { homepageCatalogService } from '@/server/services/homepage-catalog-service';
import { homepageProcessStepService } from '@/server/services/homepage-process-step-service';
import { projectService } from '@/server/services/project-service';
import { PageAnimations } from '@/components/marketing/page-animations';

export async function generateMetadata() {
  return getPageMetadata('home');
}

export default async function Home() {
  const [settings, catalogItems, testimonials, partnerLogos, processSteps, featuredProjects] = await Promise.all([
    siteSettingsService.getPublic(),
    homepageCatalogService.listEnabled(),
    testimonialService.listFeatured(),
    partnerLogoService.listEnabled(),
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
    <div className='flex min-h-screen flex-col bg-[#111113] text-[#e5e2e1] antialiased selection:bg-brand selection:text-white'>
      <PageJsonLd id='home' />
      <main className='grow'>
        <StitchHero
          heroVideoEnabled={settings.heroVideoEnabled}
          heroVideo={settings.heroVideo}
          heroFallbackImage={settings.heroFallbackImage}
          eyebrow={settings.heroEyebrow}
          headlineLine1={settings.heroHeadlineLine1}
          headlineLine2={settings.heroHeadlineLine2}
          headlineAccent={settings.heroHeadlineAccent}
          subtext={settings.heroSubtext}
          trustItems={trustItems}
        />
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
        <PageAnimations />
      </main>
    </div>
  );
}
