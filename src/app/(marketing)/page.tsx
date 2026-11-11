import { visibleCopy } from '@/lib/features';
import { getInsuranceEnabled } from '@/server/queries/get-features';
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
import { getSetting } from '@/server/queries/get-setting';
import { PageAnimations } from '@/components/marketing/page-animations';

export async function generateMetadata() {
  return getPageMetadata('home');
}

const QUOTE_SUBTEXT_NEUTRAL =
  'No need to take time off work or drive in with damage. Upload three photos and our Dublin estimators will issue an itemised quote with estimated completion dates.';

export default async function Home() {
  const [
    settings,
    catalogItems,
    testimonials,
    partnerLogos,
    processSteps,
    featuredProjects,
    quoteCopy,
    homePage,
    insurance,
  ] = await Promise.all([
    siteSettingsService.getPublic(),
    homepageCatalogService.listEnabled(),
    testimonialService.listFeatured(),
    partnerLogoService.listEnabled(),
    homepageProcessStepService.listEnabled(),
    projectService.listFeatured(),
    getSetting('quoteForm'),
    getSetting('page.home'),
    getInsuranceEnabled(),
  ]);

  // A badge about insurance is blanked in place (its icon slot stays) while the switch is off.
  const trustItems = [
    { title: settings.trustBadge1Title ?? '', subtitle: settings.trustBadge1Subtitle ?? '' },
    { title: settings.trustBadge2Title ?? '', subtitle: settings.trustBadge2Subtitle ?? '' },
    { title: settings.trustBadge3Title ?? '', subtitle: settings.trustBadge3Subtitle ?? '' },
    { title: settings.trustBadge4Title ?? '', subtitle: settings.trustBadge4Subtitle ?? '' },
  ].map((item) => (visibleCopy(insurance, item.title, item.subtitle) ? item : { title: '', subtitle: '' }));
  const quoteHeading = visibleCopy(insurance, homePage.quoteSection.subtext)
    ? homePage.quoteSection
    : { ...homePage.quoteSection, subtext: QUOTE_SUBTEXT_NEUTRAL };

  return (
    <div className='flex min-h-screen flex-col bg-[#1b1f26] text-[#f1f3f6] antialiased selection:bg-brand selection:text-[#f1f3f6]'>
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
        <StitchEstimator
          copy={quoteCopy}
          heading={quoteHeading}
          whatsappNumber={settings.whatsappNumber || settings.phone}
        />
        <StitchCaseStudies projects={featuredProjects} />
        <StitchProcess steps={processSteps.filter((step) => visibleCopy(insurance, step.title, step.description))} />
        <StitchSocialProof testimonials={testimonials} partnerLogos={partnerLogos} insurance={insurance} />
        <PageAnimations />
      </main>
    </div>
  );
}
