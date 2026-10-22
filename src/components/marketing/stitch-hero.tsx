/* eslint-disable @next/next/no-img-element -- Figma SVG icons render at intrinsic size */
import Image from 'next/image';
import type { PublicImage } from '@/lib/media/public-image';

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
  const fallbackImageSrc = heroFallbackImage?.src ?? '/assets/marketing/stitch-hero.jpg';

  return (
    <section className='relative w-full overflow-hidden bg-[#111113] font-[family-name:var(--font-inter)]'>
      {/* Background media */}
      <div className='absolute inset-0 z-0'>
        {showVideo && heroVideo ? (
          <video autoPlay muted loop playsInline poster={fallbackImageSrc} className='h-full w-full object-cover'>
            <source src={heroVideo.src} type={heroVideo.mimeType ?? 'video/mp4'} />
          </video>
        ) : (
          <Image
            src={fallbackImageSrc}
            alt='Vantage Autobody Dublin precision workshop'
            fill
            priority
            sizes='100vw'
            className='object-cover'
          />
        )}
        {/* Shade (left to right) */}
        <div className='absolute inset-0 bg-[linear-gradient(90deg,rgba(13,13,13,0.9)_0%,rgba(13,13,13,0.75)_40%,rgba(13,13,13,0.3)_62%,rgba(13,13,13,0.1)_100%)]' />
        {/* Fade to page */}
        <div className='absolute inset-x-0 bottom-0 h-[260px] bg-[linear-gradient(180deg,rgba(20,20,20,0)_0%,rgba(20,20,20,0.45)_50%,#141414_100%)]' />
      </div>

      <div className='relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-16 px-4 pt-28 pb-14 sm:px-6 sm:pt-32 lg:gap-[110px] lg:px-0 lg:pt-[150px] lg:pb-[88px]'>
        {/* Hero copy */}
        <div data-hero-copy className='flex w-full max-w-[760px] flex-col items-start gap-6 lg:gap-8'>
          {/* Eyebrow */}
          <div className='inline-flex max-w-full items-center gap-2.5 rounded-full border border-[#252525] bg-[#16161a] py-[7px] pr-4 pl-3.5'>
            <img
              src='/assets/landing/1606e632d7f1d3ed093428897b21854cb1b7b173.svg'
              alt=''
              width={6}
              height={6}
              className='shrink-0'
            />
            <span className='text-[11px] leading-normal tracking-[0.44px] text-[#d4d4d4] uppercase'>{eyebrow}</span>
          </div>

          {/* Heading */}
          <h1 className='font-[family-name:var(--font-manrope)] text-[44px] leading-[1.05] font-extrabold tracking-[-0.03em] uppercase sm:text-[64px] lg:text-[84px] lg:leading-[88px]'>
            <span className='block text-white'>{headlineLine1}</span>
            <span className='block text-white'>{headlineLine2}</span>
            <span className='block text-[#dc2626]'>{headlineAccent}</span>
          </h1>

          {/* Subheading */}
          <p className='max-w-[600px] text-base leading-[1.6] text-[#d4d4d4] sm:text-[18px] sm:leading-[29px]'>
            {subtext}
          </p>

          {/* CTAs */}
          <div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center'>
            <a
              href='#estimator'
              className='group flex items-center justify-center gap-2.5 rounded-[8px] bg-[#dc2626] py-4 pr-[22px] pl-6 shadow-[0_8px_14px_rgba(220,38,38,0.35)] transition-colors hover:bg-[#b91c1c] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113] focus-visible:outline-none'
            >
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
            </a>

            <a
              href='#work'
              className='flex items-center justify-center gap-2.5 rounded-[8px] border border-[#34343a] bg-[#16161a] px-6 py-4 transition-colors hover:border-[#dc2626] hover:bg-[#1d1d22] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113] focus-visible:outline-none'
            >
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
            </a>
          </div>
        </div>

        {/* Trust row */}
        {trustRow.length > 0 && (
          <div
            data-hero-trust
            className='grid grid-cols-1 gap-6 border-t border-[#232328] pt-10 sm:grid-cols-2 lg:grid-cols-4'
          >
            {trustRow.map(({ icon, title, sub }, index) => (
              <div key={`${title}-${index}`} className='flex min-w-0 items-center gap-3.5'>
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
