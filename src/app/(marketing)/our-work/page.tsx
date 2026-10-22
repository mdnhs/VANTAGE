import type { Metadata } from 'next';
import { PortfolioHero } from '@/components/marketing/portfolio-hero';
import { ProjectGrid } from '@/components/marketing/project-grid';
import {
  SECTION_BG,
  SECTION_CONTAINER,
  SECTION_PADDING,
  SectionHeader,
} from '@/components/marketing/ui/landing-primitives';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { projectService } from '@/server/services/project-service';
import { PageAnimations } from '@/components/marketing/page-animations';

export const metadata: Metadata = {
  title: 'Our Work',
  description:
    'Explore a curated selection of our most challenging and rewarding restoration projects. Precision engineering meets master craftsmanship.',
  alternates: { canonical: '/our-work' },
};

export default async function OurWorkPage() {
  const [projects, settings] = await Promise.all([projectService.listPublished(), siteSettingsService.getPublic()]);

  return (
    <main className='flex w-full flex-col'>
      <PortfolioHero
        eyebrow={settings.ourWorkHeroEyebrow ?? 'Portfolio'}
        headlineLine1={settings.ourWorkHeroHeadlineLine1 ?? 'Our Recent'}
        headlineAccent={settings.ourWorkHeroHeadlineAccent ?? 'Restorations.'}
        subtext={
          settings.ourWorkHeroSubtext ??
          'Explore a curated selection of our most challenging and rewarding projects. Precision engineering meets master craftsmanship.'
        }
      />

      <section className={`w-full ${SECTION_BG.raised} ${SECTION_PADDING}`}>
        <div className={`${SECTION_CONTAINER} gap-10 sm:gap-12 lg:gap-16`}>
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
