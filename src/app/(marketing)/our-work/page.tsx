import type { Metadata } from 'next';
import Image from 'next/image';
import { PortfolioHero } from '@/components/marketing/portfolio-hero';
import { PortfolioFilters } from '@/components/marketing/portfolio-filters';
import { ProjectGrid } from '@/components/marketing/project-grid';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { projectService } from '@/server/services/project-service';

export const metadata: Metadata = {
  title: 'Our Work',
  description:
    'Explore a curated selection of our most challenging and rewarding restoration projects. Precision engineering meets master craftsmanship.',
  alternates: { canonical: '/our-work' },
};

export default async function OurWorkPage() {
  const [projects, settings] = await Promise.all([projectService.listPublished(), siteSettingsService.getPublic()]);

  return (
    <>
      <main className='container mx-auto flex flex-col gap-12 px-4 pt-24 pb-12 sm:gap-16 sm:px-6 sm:pt-32 md:px-12 lg:pt-40'>
        <PortfolioHero
          eyebrow={settings.ourWorkHeroEyebrow ?? 'Portfolio'}
          headlineLine1={settings.ourWorkHeroHeadlineLine1 ?? 'Our Recent'}
          headlineAccent={settings.ourWorkHeroHeadlineAccent ?? 'Restorations.'}
          subtext={
            settings.ourWorkHeroSubtext ??
            'Explore a curated selection of our most challenging and rewarding projects. Precision engineering meets master craftsmanship.'
          }
        />
        <PortfolioFilters />
        <ProjectGrid projects={projects} />
        <div className='flex justify-center'>
          <button
            type='button'
            className='flex w-full items-center justify-center gap-2 border border-white/20 px-8 py-4 text-xs font-semibold tracking-[1.8px] text-[#e5e2e1] uppercase transition-all hover:-translate-y-1 hover:bg-white/5 sm:w-auto'
          >
            <span>Load More Projects</span>
            <Image
              src='/assets/marketing/icon-load-more.svg'
              alt=''
              width={11}
              height={15}
              className='h-[15px] w-[11px]'
            />
          </button>
        </div>
      </main>
    </>
  );
}
