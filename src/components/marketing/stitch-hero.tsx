/* eslint-disable @next/next/no-img-element -- Figma SVG icons render at intrinsic size */
import { RevealContent } from '@/components/marketing/ui/reveal-content';
import Link from 'next/link';
import Image from 'next/image';
import { sizedSrc, type PublicImage } from '@/lib/media/public-image';

// Icon per trust-row position is fixed (exact Figma SVGs); only the title/subtitle text is
// CMS-driven (Site settings → Homepage tab), zipped in by index with `trustItems`.
// width/height are the SVGs' intrinsic sizes, centred inside a 20px icon box.
const TRUST_ICONS = [
  { src: '/assets/landing/4f50bc096caab729287d6ab428426fc218da3217.svg', width: 16.5003, height: 18.1667 },
  { src: '/assets/landing/748957ed26a5f6edce8abe999a06496000145e7d.svg', width: 16.5, height: 18.1667 },
  { src: '/assets/landing/556de90b7d722c33e505e8dd081b7a18126fa5a9.svg', width: 18.1667, height: 16.5 },
  { src: '/assets/landing/af0cb3fff4cab8ede387c3aa317fe0f4f538664d.svg', width: 18.1667, height: 18.1667 },
] as const;

interface TrustItem {
  title: string;
  subtitle: string;
}

interface StitchHeroProps {
  heroVideoEnabled?: boolean;
  heroVideo?: PublicImage | null;
  heroFallbackImage?: PublicImage | null;
  eyebrow?: string | null;
  headlineLine1?: string | null;
  headlineLine2?: string | null;
  headlineAccent?: string | null;
  subtext?: string | null;
  trustItems?: TrustItem[];
}

// Background media and hero copy are CMS-driven (Site settings); the bundled workshop shot
// and hardcoded copy below are the fallback until an admin edits Site settings.
export function StitchHero({
  heroVideoEnabled = false,
  heroVideo = null,
  heroFallbackImage = null,
  eyebrow = "Ireland's Premier Collision & Respray Specialists",
  headlineLine1 = 'We Restore',
  headlineLine2 = 'Your Car',
  headlineAccent = 'To Its Best.',
  subtext = 'Manufacturer-standard accident repair, computerized laser chassis realignment, certified spray painting, and bespoke automotive restoration in Dublin. Your vehicle, our obsession.',
  trustItems = [],
}: StitchHeroProps) {
  const trustRow = TRUST_ICONS.map((icon, index) => ({
    icon,
    title: trustItems[index]?.title ?? '',
    sub: trustItems[index]?.subtitle ?? '',
  })).filter((item) => item.title || item.sub);
  const showVideo = heroVideoEnabled && Boolean(heroVideo);
  const fallbackImageSrc = heroFallbackImage
    ? sizedSrc(heroFallbackImage, 'w_1920')
    : '/assets/marketing/stitch-hero.jpg';

  return (
    <section className='relative w-full overflow-hidden bg-[#111113] font-site-body'>
      {/* Background media */}
      <div className='absolute inset-0 z-0'>
        {showVideo && heroVideo ? (
          <video
            data-hero-media
            autoPlay
            muted
            loop
            playsInline
            poster={fallbackImageSrc}
            className='h-full w-full object-cover object-[68%_50%] sm:object-center'
          >
            <source src={heroVideo.src} type={heroVideo.mimeType ?? 'video/mp4'} />
          </video>
        ) : (
          <Image
            data-hero-media
            src={fallbackImageSrc}
            alt='Precision car body repair workshop in Dublin'
            fill
            priority
            sizes='100vw'
            className='object-cover object-[68%_50%] sm:object-center'
          />
        )}
        {/* Shade: top to bottom on phones, where the copy spans the width; left to right from sm up */}
        <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(13,13,13,0.1)_0%,rgba(13,13,13,0.2)_22%,rgba(13,13,13,0.78)_52%,rgba(13,13,13,0.94)_100%)] sm:hidden' />
        <div className='absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(13,13,13,0.9)_0%,rgba(13,13,13,0.75)_40%,rgba(13,13,13,0.3)_62%,rgba(13,13,13,0.1)_100%)] sm:block' />
        {/* Fade to page */}
        <div className='absolute inset-x-0 bottom-0 h-[120px] bg-[linear-gradient(180deg,rgba(20,20,20,0)_0%,rgba(20,20,20,0.45)_50%,#141414_100%)] sm:h-[260px]' />
      </div>

      <div className='relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 pt-10 pb-10 sm:gap-16 sm:px-6 sm:pt-32 sm:pb-14 lg:gap-[110px] lg:px-0 lg:pt-[150px] lg:pb-[88px]'>
        {/* First screen (copy at the bottom on phones so the background shows above it, centred from sm): header + this block fill the viewport (svh holds steady while a phone's address
            bar shows or hides). The offsets are the sticky header (73px, 97px from sm) plus this
            container's top padding (40px, 128px from sm, 150px from lg). Taller copy just grows past it. */}
        <div className='relative flex min-h-[calc(100svh-113px)] flex-col justify-end pb-8 sm:min-h-[calc(100svh-225px)] sm:justify-center sm:pb-0 lg:min-h-[calc(100svh-247px)]'>
          <div data-hero-copy className='flex w-full max-w-[760px] flex-col items-start gap-5 sm:gap-6 lg:gap-8'>
            {/* Eyebrow */}
            <div className='inline-flex max-w-full items-center gap-2.5 rounded-[18px] border border-[#252525] bg-[#16161a] py-[7px] pr-4 pl-3.5 sm:rounded-full'>
              <img
                src='/assets/landing/1606e632d7f1d3ed093428897b21854cb1b7b173.svg'
                alt=''
                width={6}
                height={6}
                className='shrink-0'
              />
              <span className='text-[10.5px] leading-snug tracking-[0.4px] text-[#d4d4d4] uppercase sm:text-[11px] sm:leading-normal sm:tracking-[0.44px]'>
                {eyebrow}
              </span>
            </div>

            {/* Heading */}
            <h1 className='font-site-heading text-[clamp(30px,9.2vw,44px)] leading-[1.05] font-extrabold tracking-[-0.03em] uppercase sm:text-[64px] lg:text-[84px] lg:leading-[88px]'>
              {/* Plain spaces between the block lines keep the words apart for crawlers and screen readers. */}
              <span className='block text-white'>{headlineLine1}</span>{' '}
              <span className='block text-white'>{headlineLine2}</span>{' '}
              <span className='block text-brand'>{headlineAccent}</span>
            </h1>

            {/* Subheading */}
            <p className='max-w-[600px] text-[15px] leading-[1.55] text-[#d4d4d4] sm:text-[18px] sm:leading-[29px]'>
              {subtext}
            </p>

            {/* CTAs */}
            <div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center'>
              <Link
                data-reveal-button
                href='/get-a-quote'
                className='group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-[8px] border border-brand bg-brand py-[15px] pr-[21px] pl-[23px] shadow-[0_8px_14px_rgb(var(--brand-rgb)/0.35)] transition-colors hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113] focus-visible:outline-none'
              >
                <RevealContent band='dark' className='gap-2.5'>
                  <span className='flex size-[18px] shrink-0 items-center justify-center'>
                    <img
                      src='/assets/landing/77f4614fe4f24a8e612134c222c8e6b222b0af4f.svg'
                      alt=''
                      width={16.125}
                      height={16.125}
                      className='max-w-none'
                    />
                  </span>
                  <span className='text-[13px] leading-normal font-semibold tracking-[1.04px] whitespace-nowrap text-white uppercase'>
                    Get a free estimate
                  </span>
                  <span className='flex size-6 shrink-0 items-center justify-center transition-transform group-hover:translate-x-1'>
                    <img
                      src='/assets/landing/59b4140a9e8daa1d2222ade20afa6a0530e51e09.svg'
                      alt=''
                      width={7.50005}
                      height={13.5001}
                      className='max-w-none'
                    />
                  </span>
                </RevealContent>
              </Link>

              <a
                data-reveal-button
                href='#work'
                className='relative flex items-center justify-center gap-2.5 overflow-hidden rounded-[8px] border border-[#34343a] bg-[#16161a] px-6 py-4 transition-colors hover:border-brand hover:bg-[#1d1d22] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113] focus-visible:outline-none'
              >
                <RevealContent band='brand' className='gap-2.5'>
                  <span className='flex size-[18px] shrink-0 items-center justify-center'>
                    <img
                      src='/assets/landing/e976313112893b5be1131d67ff6e9f554ddb598d.svg'
                      alt=''
                      width={15.375}
                      height={15.375}
                      className='max-w-none'
                    />
                  </span>
                  <span className='text-[13px] leading-normal font-semibold tracking-[1.04px] whitespace-nowrap text-white uppercase'>
                    View our work
                  </span>
                </RevealContent>
              </a>
            </div>
          </div>
          {/* Scroll cue (PageAnimations draws the line and fades it away on scroll) */}
          <div
            data-scroll-cue
            aria-hidden='true'
            className='pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex [@media(max-height:760px)]:hidden'
          >
            <span className='text-[10px] tracking-[0.2em] text-white/55 uppercase'>Scroll</span>
            <span className='relative block h-9 w-px overflow-hidden bg-white/15'>
              <span data-cue-line className='absolute inset-0 block bg-white/70' />
            </span>
          </div>
        </div>

        {/* Trust row */}
        {trustRow.length > 0 && (
          <div
            data-hero-trust
            className='grid grid-cols-2 gap-x-4 gap-y-5 border-t border-[#232328] pt-7 sm:gap-6 sm:pt-10 lg:grid-cols-4'
          >
            {trustRow.map(({ icon, title, sub }, index) => (
              <div
                key={`${title}-${index}`}
                className='flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-3.5'
              >
                <div className='flex shrink-0 items-center justify-center rounded-[10px] bg-white p-[11px]'>
                  <span className='flex size-5 items-center justify-center'>
                    <img src={icon.src} alt='' width={icon.width} height={icon.height} className='max-w-none' />
                  </span>
                </div>
                <div className='flex min-w-0 flex-col gap-[3px] leading-normal'>
                  <span className='text-[14px] font-semibold text-white'>{title}</span>
                  <span className='text-[10px] tracking-[0.4px] text-[#737373] uppercase'>{sub}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
