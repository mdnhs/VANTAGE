import type { Metadata } from 'next';
import Image from 'next/image';
import { MarketingHeader } from '@/components/marketing/header';
import { MarketingFooter } from '@/components/marketing/footer';
import { PortfolioHero } from '@/components/marketing/portfolio-hero';
import { PortfolioFilters } from '@/components/marketing/portfolio-filters';
import { ProjectGrid } from '@/components/marketing/project-grid';

export const metadata: Metadata = {
  title: 'Our Work — Vantage Autobody',
  description:
    'Explore a curated selection of our most challenging and rewarding restoration projects. Precision engineering meets master craftsmanship.',
  alternates: { canonical: '/our-work' },
};

export default function OurWorkPage() {
  return (
    <>
      <MarketingHeader />
      <main className='flex flex-col gap-20 px-6 pt-32 pb-16 sm:px-12 lg:gap-16 lg:pt-40'>
        <PortfolioHero />
        <PortfolioFilters />
        <ProjectGrid />
        <div className='flex justify-center'>
          <button
            type='button'
            className='flex items-center gap-2 border border-white/20 px-8 py-4 text-xs font-semibold tracking-[1.8px] text-[#e5e2e1] uppercase transition-all hover:-translate-y-1 hover:bg-white/5'
          >
            Load More Projects
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
      <MarketingFooter />
    </>
  );
}
