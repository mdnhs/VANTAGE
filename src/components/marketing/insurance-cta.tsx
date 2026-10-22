/* eslint-disable @next/next/no-img-element */
import {
  BODY_TEXT,
  ButtonLink,
  Eyebrow,
  SECTION_BG,
  SECTION_CONTAINER,
  SECTION_PADDING,
} from '@/components/marketing/ui/landing-primitives';

const ICON_PHONE = '/assets/landing/0943df176868fa54f9c4d56f120f2cb266e6fd3b.svg';
const ICON_UPLOAD = '/assets/landing/d67c13a6cce7df3d3e67ee755b356d94c1f1ca8e.svg';

interface InsuranceCtaProps {
  line1: string;
  accent: string;
  subtext: string;
}

// Claims-specific call to action. Kept as a split card (copy left, actions right) so it reads
// differently from the site-wide centred CTA banner the layout renders below it.
export function InsuranceCta({ line1, accent, subtext }: InsuranceCtaProps) {
  return (
    <section className={SECTION_BG.raised}>
      <div className={`${SECTION_CONTAINER} ${SECTION_PADDING}`}>
        <div className='flex flex-col gap-10 rounded-[20px] border border-[#2a2a30] bg-[#1b1b20] p-7 sm:p-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16 lg:p-14'>
          <div className='flex max-w-[640px] flex-col items-start gap-5'>
            <Eyebrow>Claims Specialists</Eyebrow>
            <h2 className='font-[family-name:var(--font-manrope)] text-[32px] leading-[38px] font-extrabold tracking-[-0.64px] text-white uppercase sm:text-[40px] sm:leading-[46px] lg:text-[48px] lg:leading-[54px] lg:tracking-[-0.96px]'>
              <span className='block'>{line1}</span>
              <span className='block text-[#dc2626]'>{accent}</span>
            </h2>
            <p className={`max-w-[520px] ${BODY_TEXT}`}>{subtext}</p>
          </div>

          <div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:shrink-0'>
            <ButtonLink
              href='/get-a-quote'
              icon={
                <span className='flex size-[18px] shrink-0 items-center justify-center'>
                  <img src={ICON_PHONE} alt='' width={14.625} height={14.625} className='max-w-none' />
                </span>
              }
            >
              Talk to Our Specialists
            </ButtonLink>
            <ButtonLink
              href='/get-a-quote'
              variant='secondary'
              icon={
                <span className='flex size-[18px] shrink-0 items-center justify-center'>
                  <img src={ICON_UPLOAD} alt='' width={18} height={18} className='max-w-none' />
                </span>
              }
            >
              Upload Estimate
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
