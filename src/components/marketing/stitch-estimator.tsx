import { SectionTitle } from '@/components/marketing/ui/section-title';
import type { ComponentProps } from 'react';

import type { GlobalValue } from '@/lib/content/globals';

import { QuoteForm } from './quote-form';

const EYEBROW_DOT = '/assets/landing/1606e632d7f1d3ed093428897b21854cb1b7b173.svg';

// The quote section: heading and reassurance on the left, the form on the right. Shown on the
// homepage for visitors who decide while scrolling, and on /get-a-quote, where every button leads.
export function StitchEstimator({
  copy,
  heading,
  source = 'homepage_estimator',
  whatsappNumber,
}: Pick<ComponentProps<typeof QuoteForm>, 'copy' | 'source' | 'whatsappNumber'> & {
  heading: GlobalValue<'page.home'>['quoteSection'];
}) {
  return (
    <section
      id='estimator'
      data-refresh-scroll
      className='relative w-full bg-[#20252d] px-5 py-14 sm:bg-[#1b1f26] sm:px-6 sm:py-24 lg:px-10 xl:py-[120px]'
    >
      <div className='mx-auto w-full max-w-[1200px]'>
        <QuoteForm
          copy={copy}
          source={source}
          whatsappNumber={whatsappNumber}
          intro={
            // Two levels deep on purpose: the page's scroll reveal picks up the heading block from here.
            <div>
              <div className='flex w-full flex-col items-start gap-3.5 sm:gap-[28px]'>
                <div className='flex items-center gap-[10px] rounded-full border border-[#353c47] bg-[#2e343e] py-1.5 pr-3 pl-2.5 sm:border-[#2e343e] sm:bg-[#20252d] sm:py-[7px] sm:pr-[16px] sm:pl-[14px]'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt='' src={EYEBROW_DOT} width={6} height={6} className='block shrink-0' />
                  <span className='text-[11px] leading-normal font-medium tracking-[0.06em] whitespace-nowrap text-[#c9ced6] uppercase sm:font-normal sm:tracking-[0.44px] sm:text-[#d5d9e0]'>
                    {heading.eyebrow}
                  </span>
                </div>

                <SectionTitle className='w-full font-site-heading text-[30px] leading-[1.08] font-extrabold tracking-[-0.3px] text-[#f1f3f6] uppercase sm:text-[48px] sm:leading-[54px] sm:tracking-[-0.96px]'>
                  {heading.line1} <span className='text-brand'>{heading.accent}</span>
                </SectionTitle>

                <p className='w-full text-[16px] leading-[26px] text-[#a4abb6]'>{heading.subtext}</p>
              </div>
            </div>
          }
        />
      </div>
    </section>
  );
}
