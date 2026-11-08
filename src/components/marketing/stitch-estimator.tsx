import type { ComponentProps } from 'react';

import type { GlobalValue } from '@/lib/content/globals';

import { QuoteForm } from './quote-form';

const EYEBROW_DOT = '/assets/landing/1606e632d7f1d3ed093428897b21854cb1b7b173.svg';

// The quote section: heading and reassurance on the left, the form on the right. Shown on the
// homepage for visitors who decide while scrolling, and on /get-a-quote, where every button leads.
export function StitchEstimator({
  services,
  copy,
  heading,
  source = 'homepage_estimator',
}: Pick<ComponentProps<typeof QuoteForm>, 'services' | 'copy' | 'source'> & {
  heading: GlobalValue<'page.home'>['quoteSection'];
}) {
  return (
    <section
      id='estimator'
      data-refresh-scroll
      className='relative w-full bg-[#111113] px-4 py-16 sm:px-6 sm:py-24 lg:px-10 xl:py-[120px]'
    >
      <div className='mx-auto w-full max-w-[1200px]'>
        <QuoteForm
          services={services}
          copy={copy}
          source={source}
          intro={
            // Two levels deep on purpose: the page's scroll reveal picks up the heading block from here.
            <div>
              <div className='flex w-full flex-col items-start gap-[28px]'>
                <div className='flex items-center gap-[10px] rounded-full border border-[#252525] bg-[#16161a] py-[7px] pr-[16px] pl-[14px]'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt='' src={EYEBROW_DOT} width={6} height={6} className='block shrink-0' />
                  <span className='text-[11px] leading-normal tracking-[0.44px] whitespace-nowrap text-[#d4d4d4] uppercase'>
                    {heading.eyebrow}
                  </span>
                </div>

                <h2 className='w-full font-site-heading text-[34px] leading-[40px] font-extrabold tracking-[-0.68px] text-white uppercase sm:text-[48px] sm:leading-[54px] sm:tracking-[-0.96px]'>
                  {heading.line1} <span className='text-brand'>{heading.accent}</span>
                </h2>

                <p className='w-full text-[16px] leading-[26px] text-[#a1a1a1]'>{heading.subtext}</p>
              </div>
            </div>
          }
        />
      </div>
    </section>
  );
}
