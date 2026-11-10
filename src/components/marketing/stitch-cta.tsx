import Image from 'next/image';
import Link from 'next/link';
import { QuoteCtaText } from '@/components/marketing/quote-cta';
import { whatsappHref } from '@/lib/content/phone';

// Figma 131:582 assets
const SOFT_LIGHT = '/assets/landing/ca42a1888870af6cc8d5afe536a8dd82ec42daf7.svg';
const BACKGROUND_GRAPHICS = '/assets/landing/255a6fc9931fce360e8bd645cc1baa464dffce2c.svg';
const EYEBROW_DOT = '/assets/landing/1606e632d7f1d3ed093428897b21854cb1b7b173.svg';
const ICON_ARROW = '/assets/landing/59b4140a9e8daa1d2222ade20afa6a0530e51e09.svg';
const LOGO_WHATSAPP = '/assets/landing/09936fdd2159e847dcf168e3160a539c758f5211.svg';

export function StitchCta({ phone }: { phone: string }) {
  return (
    <section id='contact' className='w-full bg-[#1b1f26]'>
      <div className='mx-auto w-full max-w-[1440px] px-5 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:p-[120px]'>
        {/* CTA banner */}
        <div className='relative flex w-full flex-col items-center justify-center gap-4 overflow-clip rounded-[20px] border border-[#353c47] bg-[#20252d] px-5 py-8 sm:gap-[28px] sm:rounded-[28px] sm:border-white/10 sm:bg-white/[0.03] sm:px-10 sm:py-20 lg:px-[80px] lg:py-[88px]'>
          {/* Soft light (760x260 node, SVG includes blur bleed) */}
          <div
            className='pointer-events-none absolute top-[-141px] left-[calc(50%-381px)] h-[260px] w-[760px] max-sm:hidden'
            aria-hidden
          >
            <div className='absolute inset-[-46.15%_-15.79%]'>
              <Image
                src={SOFT_LIGHT}
                alt=''
                width={1000}
                height={500}
                unoptimized
                className='block size-full max-w-none'
              />
            </div>
          </div>

          {/* Background graphics — full-bleed at desktop, natural size (centred, clipped) below */}
          <div
            className='pointer-events-none absolute top-[-1px] left-1/2 h-[581px] w-[1200px] -translate-x-1/2 max-sm:hidden xl:inset-[-1px] xl:h-auto xl:w-auto xl:translate-x-0'
            aria-hidden
          >
            <Image
              src={BACKGROUND_GRAPHICS}
              alt=''
              width={1200}
              height={581}
              unoptimized
              className='absolute inset-0 block size-full max-w-none'
            />
          </div>

          {/* Eyebrow */}
          <div className='relative flex max-w-full items-center gap-[10px] rounded-[999px] border border-[#353c47] bg-[#2e343e] py-1.5 pr-3 pl-2.5 sm:border-white/[0.12] sm:bg-white/[0.06] sm:py-[7px] sm:pr-[16px] sm:pl-[14px]'>
            <span className='relative block size-[6px] shrink-0'>
              <Image
                src={EYEBROW_DOT}
                alt=''
                width={6}
                height={6}
                unoptimized
                className='absolute inset-0 block size-full max-w-none'
              />
            </span>
            <span className='text-[11px] leading-[normal] font-medium tracking-[0.06em] text-[#c9ced6] sm:font-normal sm:tracking-[0.44px] sm:whitespace-nowrap sm:text-white/80'>
              SAME-DAY WALK-IN VEHICLE ASSESSMENTS
            </span>
          </div>

          {/* Heading */}
          <h2 className='relative w-full max-w-[820px] text-center font-site-heading text-[28px] leading-[1.12] font-extrabold text-[#f1f3f6] sm:text-[42px] sm:leading-[50px] sm:tracking-[-1px] lg:text-[52px] lg:leading-[60px] lg:tracking-[-1.3px]'>
            READY TO RESTORE YOUR VEHICLE TO <span className='text-brand'>FLAWLESS STANDARD?</span>
          </h2>

          {/* Body */}
          <p className='relative w-full max-w-[620px] text-center text-[15px] leading-[1.55] text-[#b9bfc9] sm:text-[17px] sm:leading-[24px] sm:leading-[27px] sm:text-white/[0.66]'>
            Speak directly with our Dublin master technicians, or submit your damage photos online for an immediate
            digital estimate.
          </p>

          {/* CTAs */}
          <div className='relative flex w-full flex-col items-stretch gap-[10px] sm:w-auto sm:flex-row sm:items-center sm:gap-[12px]'>
            <Link
              href='/get-a-quote'
              data-reveal-button
              className='relative flex min-h-[52px] items-center justify-center overflow-hidden rounded-[12px] border border-brand bg-brand py-[15px] pr-[21px] pl-[23px] text-[13px] leading-[normal] font-semibold tracking-[1.04px] whitespace-nowrap text-[#f1f3f6] uppercase drop-shadow-[0px_10px_14px_rgb(var(--brand-rgb)/0.35)] transition-colors hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none sm:min-h-0 sm:rounded-[8px]'
            >
              <span data-reveal-band aria-hidden className='absolute inset-0 bg-[#20252d] opacity-0' />
              <span className='relative block overflow-hidden'>
                <span data-reveal-rise className='flex items-center gap-[10px]'>
                  <span>
                    <QuoteCtaText />
                  </span>
                  <span className='relative block size-[24px] shrink-0 overflow-clip'>
                    <span className='absolute top-1/4 right-[37.5%] bottom-1/4 left-[37.5%]'>
                      <span className='absolute inset-[-6.25%_-12.5%]'>
                        <Image
                          src={ICON_ARROW}
                          alt=''
                          width={7.50005}
                          height={13.5001}
                          unoptimized
                          className='block size-full max-w-none'
                        />
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </Link>

            <a
              href={whatsappHref(phone)}
              target='_blank'
              rel='noopener noreferrer'
              data-reveal-button
              className='relative flex min-h-[52px] items-center justify-center overflow-hidden rounded-[12px] border border-[#3e4551] bg-[#2e343e] px-[24px] py-[16px] text-[13px] leading-[normal] font-semibold tracking-[1.04px] whitespace-nowrap text-[#f1f3f6] uppercase transition-colors hover:border-white/[0.28] hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none sm:min-h-0 sm:rounded-[8px] sm:border-white/[0.16] sm:bg-white/[0.06]'
            >
              <span data-reveal-band aria-hidden className='absolute inset-0 bg-brand opacity-0' />
              <span className='relative block overflow-hidden'>
                <span data-reveal-rise className='flex items-center gap-[10px]'>
                  <span className='relative block size-[22px] shrink-0'>
                    <Image
                      src={LOGO_WHATSAPP}
                      alt=''
                      width={22}
                      height={22}
                      unoptimized
                      className='absolute inset-0 block size-full max-w-none'
                    />
                  </span>
                  <span>WhatsApp photos</span>
                </span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
