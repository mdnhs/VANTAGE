import Image from 'next/image';
import Link from 'next/link';

// Figma 131:582 assets
const SOFT_LIGHT = '/assets/landing/ca42a1888870af6cc8d5afe536a8dd82ec42daf7.svg';
const BACKGROUND_GRAPHICS = '/assets/landing/255a6fc9931fce360e8bd645cc1baa464dffce2c.svg';
const EYEBROW_DOT = '/assets/landing/1606e632d7f1d3ed093428897b21854cb1b7b173.svg';
const ICON_ARROW = '/assets/landing/59b4140a9e8daa1d2222ade20afa6a0530e51e09.svg';
const LOGO_WHATSAPP = '/assets/landing/09936fdd2159e847dcf168e3160a539c758f5211.svg';

export function StitchCta({ phone }: { phone: string }) {
  const digits = phone.replace(/[^\d+]/g, '');

  return (
    <section id='contact' className='w-full bg-[#111113]'>
      <div className='mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:p-[120px]'>
        {/* CTA banner */}
        <div className='relative flex w-full flex-col items-center justify-center gap-6 overflow-clip rounded-[20px] border border-white/10 bg-white/[0.03] px-5 py-14 sm:gap-[28px] sm:rounded-[28px] sm:px-10 sm:py-20 lg:px-[80px] lg:py-[88px]'>
          {/* Soft light (760x260 node, SVG includes blur bleed) */}
          <div
            className='pointer-events-none absolute top-[-141px] left-[calc(50%-381px)] h-[260px] w-[760px]'
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
            className='pointer-events-none absolute top-[-1px] left-1/2 h-[581px] w-[1200px] -translate-x-1/2 xl:inset-[-1px] xl:h-auto xl:w-auto xl:translate-x-0'
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
          <div className='relative flex max-w-full items-center gap-[10px] rounded-[999px] border border-white/[0.12] bg-white/[0.06] py-[7px] pr-[16px] pl-[14px]'>
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
            <span className='text-[11px] leading-[normal] tracking-[0.44px] text-white/80 sm:whitespace-nowrap'>
              SAME-DAY WALK-IN VEHICLE ASSESSMENTS
            </span>
          </div>

          {/* Heading */}
          <h2 className='relative w-full max-w-[820px] text-center font-[family-name:var(--font-manrope)] text-[30px] leading-[36px] font-extrabold tracking-[-0.75px] text-white sm:text-[42px] sm:leading-[50px] sm:tracking-[-1px] lg:text-[52px] lg:leading-[60px] lg:tracking-[-1.3px]'>
            READY TO RESTORE YOUR VEHICLE TO <span className='text-[#dc2626]'>FLAWLESS STANDARD?</span>
          </h2>

          {/* Body */}
          <p className='relative w-full max-w-[620px] text-center text-[15px] leading-[24px] text-white/[0.66] sm:text-[17px] sm:leading-[27px]'>
            Speak directly with our Dublin master technicians, or submit your damage photos online for an immediate
            digital estimate.
          </p>

          {/* CTAs */}
          <div className='relative flex w-full flex-col items-stretch gap-[12px] sm:w-auto sm:flex-row sm:items-center'>
            <Link
              href='/#estimator'
              className='flex items-center justify-center gap-[10px] rounded-[8px] bg-[#dc2626] py-[16px] pr-[22px] pl-[24px] text-[13px] leading-[normal] font-semibold tracking-[1.04px] whitespace-nowrap text-white uppercase drop-shadow-[0px_10px_14px_rgba(219,38,38,0.35)] transition-colors hover:bg-[#b91c1c] focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none'
            >
              <span>Get free quote online</span>
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
            </Link>

            <a
              href={`https://wa.me/${digits.replace('+', '')}`}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center justify-center gap-[10px] rounded-[8px] border border-white/[0.16] bg-white/[0.06] px-[24px] py-[16px] text-[13px] leading-[normal] font-semibold tracking-[1.04px] whitespace-nowrap text-white uppercase transition-colors hover:border-white/[0.28] hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none'
            >
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
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
