import { getPageMetadata } from '@/server/queries/get-page-seo';
import { PageJsonLd } from '@/components/seo/page-json-ld';
import { PortfolioHero } from '@/components/marketing/portfolio-hero';
import { ProjectGrid } from '@/components/marketing/project-grid';
import { SECTION_BG, SectionHeader } from '@/components/marketing/ui/landing-primitives';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { projectService } from '@/server/services/project-service';
import { PageAnimations } from '@/components/marketing/page-animations';

export async function generateMetadata() {
  return getPageMetadata('our-work');
}

export default async function OurWorkPage() {
  const [projects, settings] = await Promise.all([projectService.listPublished(), siteSettingsService.getPublic()]);

  return (
    <main className='flex w-full flex-col'>
      <PageJsonLd id='our-work' />
      <PortfolioHero
        eyebrow={settings.ourWorkHeroEyebrow ?? 'Portfolio'}
        headlineLine1={settings.ourWorkHeroHeadlineLine1 ?? 'Our Recent'}
        headlineAccent={settings.ourWorkHeroHeadlineAccent ?? 'Restorations.'}
        subtext={
          settings.ourWorkHeroSubtext ??
          'Explore a curated selection of our most challenging and rewarding projects. Precision engineering meets master craftsmanship.'
        }
        video={settings.ourWorkHeroVideo}
        fallbackImage={settings.ourWorkHeroFallbackImage}
        videoEnabled={settings.ourWorkHeroVideoEnabled}
      />

      <section className={`w-full ${SECTION_BG.raised} py-14 sm:py-24 xl:bg-[#1b1f26] xl:py-[120px]`}>
        <div
          className={`mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-5 sm:gap-12 sm:px-6 lg:gap-16 lg:px-12 xl:gap-10 xl:px-0`}
        >
          <SectionHeader
            eyebrow='Verified Results'
            title='Before & After'
            accent='Restoration Proof.'
            intro='Zero flaws, undetectable colour transitions and exact factory panel gaps, inspected under 2,000-lumen lighting.'
          />
          <ProjectGrid projects={projects} />
        </div>
      </section>
      <PageAnimations />
    </main>
  );
}
