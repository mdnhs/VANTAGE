import Image from 'next/image';
import { Calculator, ArrowRight, Images, Star, Landmark, BadgeCheck, Car } from 'lucide-react';
import { cldUrl } from '@/lib/cloudinary/url';

// Icon + accent color per trust-ticker position are fixed; only the title/subtitle text is
// CMS-driven (Site settings → Homepage tab), zipped in by index with `trustItems`.
const TRUST_ICONS = [
  { icon: Star, iconClass: 'text-amber-400' },
  { icon: Landmark, iconClass: 'text-[#dc2626]' },
  { icon: BadgeCheck, iconClass: 'text-emerald-400' },
  { icon: Car, iconClass: 'text-sky-400' },
] as const;

interface TrustItem {
  title: string;
  subtitle: string;
}

interface StitchHeroProps {
  heroVideoEnabled?: boolean;
  heroVideoPublicId?: string | null;
  heroFallbackImagePublicId?: string | null;
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
  heroVideoPublicId = null,
  heroFallbackImagePublicId = null,
  eyebrow = "Ireland's Premier Collision & Respray Specialists",
  headlineLine1 = 'We Restore',
  headlineLine2 = 'Your Car',
  headlineAccent = 'To Its Best.',
  subtext = 'Manufacturer-standard accident repair, computerized laser chassis realignment, certified spray painting, and bespoke automotive restoration in Dublin. Your vehicle, our obsession.',
  trustItems = [],
}: StitchHeroProps) {
  const trustTicker = TRUST_ICONS.map((entry, index) => ({
    ...entry,
    title: trustItems[index]?.title ?? '',
    sub: trustItems[index]?.subtitle ?? '',
  })).filter((item) => item.title || item.sub);
  const showVideo = heroVideoEnabled && Boolean(heroVideoPublicId);
  const fallbackImageSrc = heroFallbackImagePublicId
    ? cldUrl(heroFallbackImagePublicId, { width: 1920 })
    : '/assets/marketing/stitch-hero.jpg';

  return (
    <section className='relative flex min-h-[760px] w-full items-center justify-center overflow-hidden border-b border-white/10 lg:min-h-[820px]'>
      {/* Background Image */}
      <div className='absolute inset-0 z-0'>
        {showVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={fallbackImageSrc}
            className='h-full w-full object-cover brightness-95 contrast-125'
          >
            <source src={cldUrl(heroVideoPublicId as string, { resourceType: 'video' })} type='video/mp4' />
          </video>
        ) : (
          <Image
            src={fallbackImageSrc}
            alt='Vantage Autobody Dublin precision workshop'
            fill
            priority
            className='object-cover brightness-95 contrast-125'
          />
        )}
        {/* Vignette Gradients */}
        <div className='absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/85 to-transparent' />
        <div className='absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/40 to-transparent' />
        <div className='absolute inset-0 bg-[radial-gradient(#dc2626_1px,transparent_1px)] [background-size:28px_28px] opacity-10' />
      </div>

      <div className='relative z-10 container mx-auto flex flex-col justify-center px-6 py-20 sm:px-12'>
        <div className='flex max-w-3xl flex-col gap-6'>
          {/* Eyebrow Badge */}
          <div className='inline-flex w-fit motion-preset-slide-down-sm items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 backdrop-blur-md motion-duration-500'>
            <span className='size-2 animate-pulse rounded-full bg-[#dc2626] shadow-[0_0_8px_#dc2626]' />
            <span className='font-mono text-[11px] tracking-widest text-neutral-300 uppercase'>{eyebrow}</span>
          </div>

          {/* Hero Headline */}
          <h1 className='motion-preset-slide-up font-[family-name:var(--font-manrope)] text-5xl leading-[1.1] font-extrabold tracking-tight text-white uppercase motion-delay-100 motion-duration-700 lg:text-[64px] lg:leading-[1.08]'>
            {headlineLine1} <br />
            {headlineLine2} <br />
            <span className='bg-gradient-to-r from-red-500 via-[#ffb4ab] to-white bg-clip-text text-transparent'>
              {headlineAccent}
            </span>
          </h1>

          {/* Subtext */}
          <p className='max-w-2xl motion-preset-slide-up-sm text-lg leading-relaxed text-neutral-300 motion-delay-200 motion-duration-700'>
            {subtext}
          </p>

          {/* CTAs */}
          <div className='flex motion-preset-slide-up-sm flex-wrap items-center gap-4 pt-4 motion-delay-300 motion-duration-700'>
            <a
              href='#estimator'
              className='group relative flex items-center gap-3 overflow-hidden rounded bg-[#dc2626] px-8 py-4 text-sm tracking-widest text-white uppercase shadow-lg shadow-red-900/40 transition-all hover:bg-red-700'
            >
              <Calculator className='size-5' />
              <span className='font-bold'>Get a Free Estimate</span>
              <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
            </a>

            <a
              href='#work'
              className='flex items-center gap-2 rounded border border-white/15 bg-[#181818]/70 px-8 py-4 text-sm tracking-widest text-white uppercase transition-all hover:border-[#dc2626] hover:bg-[#2a2a2a]'
            >
              <Images className='size-[18px] text-neutral-400' />
              <span>View Our Work</span>
            </a>
          </div>

          {/* Trust Ticker */}
          <div className='mt-2 grid motion-preset-fade grid-cols-2 gap-4 border-t border-white/10 pt-8 motion-delay-500 motion-duration-700 md:grid-cols-4'>
            {trustTicker.map(({ icon: Icon, iconClass, title, sub }, index) => (
              <div key={`${title}-${index}`} className='flex items-center gap-2.5'>
                <Icon className={`size-[18px] shrink-0 ${iconClass}`} />
                <div className='flex flex-col'>
                  <span className='text-xs leading-tight font-bold text-white'>{title}</span>
                  <span className='font-mono text-[11px] text-neutral-400'>{sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
