import Image from 'next/image';
import Link from 'next/link';
import { cldUrl } from '@/lib/cloudinary/url';

interface HeroSectionProps {
  heroVideoEnabled?: boolean;
  heroVideoPublicId?: string | null;
  heroFallbackImagePublicId?: string | null;
}

export function HeroSection({
  heroVideoEnabled = false,
  heroVideoPublicId = null,
  heroFallbackImagePublicId = null,
}: HeroSectionProps) {
  const showVideo = heroVideoEnabled && Boolean(heroVideoPublicId);
  const fallbackImageSrc = heroFallbackImagePublicId
    ? cldUrl(heroFallbackImagePublicId, { width: 1920 })
    : '/assets/marketing/hero.jpg';

  return (
    <section className='relative container mx-auto flex min-h-[580px] items-center overflow-hidden px-4 pt-28 pb-20 sm:min-h-[700px] sm:px-6 sm:pt-36 sm:pb-28 md:px-12 lg:min-h-[790px] lg:pt-40 lg:pb-40'>
      <div className='absolute inset-0 z-0'>
        {showVideo ? (
          <video autoPlay muted loop playsInline poster={fallbackImageSrc} className='h-full w-full object-cover'>
            <source src={cldUrl(heroVideoPublicId as string, { resourceType: 'video' })} type='video/mp4' />
          </video>
        ) : (
          <Image
            src={fallbackImageSrc}
            alt='Restored sports car in the Vantage Autobody workshop'
            fill
            priority
            className='object-cover'
          />
        )}
        <div className='absolute inset-0 bg-gradient-to-r from-[rgba(19,19,19,0.9)] via-[rgba(19,19,19,0.6)] via-50% to-[rgba(19,19,19,0)]' />
        <div className='absolute inset-0 bg-gradient-to-t from-[#131313] to-transparent opacity-80' />
      </div>

      <div className='relative z-10 flex max-w-[768px] motion-preset-slide-up flex-col gap-6 motion-duration-700 sm:gap-8'>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-4'>
            <span className='h-px w-8 bg-red-500 sm:w-12' />
            <span className='text-xs font-semibold tracking-[1.2px] text-red-500 uppercase'>
              Precision Engineering &amp; Restoration
            </span>
          </div>

          <h1 className='xs:text-4xl font-[family-name:var(--font-manrope)] text-3xl leading-[1.1] font-extrabold tracking-tight text-white uppercase sm:text-5xl sm:tracking-[-1.28px] lg:text-[64px] lg:leading-[72px]'>
            We Restore
            <br />
            Your Car
            <br />
            <span className='text-[#dc2626]'>To Its Best.</span>
          </h1>

          <p className='max-w-[576px] text-sm leading-relaxed text-neutral-300 sm:text-lg sm:leading-7'>
            Professional crash repair, structural bodywork, precision paint, and high-end vehicle restoration in
            Ireland. Your vehicle, our obsession.
          </p>
        </div>

        <div className='flex w-full flex-col flex-wrap gap-4 pt-2 sm:w-auto sm:flex-row sm:pt-4'>
          <Link
            href='/get-a-quote'
            className='group relative flex w-full items-center justify-center overflow-hidden bg-[#dc2626] px-8 py-4 text-center text-xs font-bold tracking-[1.2px] text-white uppercase shadow-[0_4px_20px_rgba(220,38,38,0.3)] transition-all hover:-translate-y-1 hover:bg-red-700 sm:w-auto'
          >
            <span className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shimmer' />
            <span className='relative'>Get a Free Quote</span>
          </Link>
          <Link
            href='#our-work'
            className='flex w-full items-center justify-center border border-white/20 px-8 py-4 text-center text-xs font-semibold tracking-[1.2px] text-white uppercase transition-all hover:border-red-500/50 hover:bg-white/5 hover:shadow-[0_4px_20px_rgba(220,38,38,0.15)] sm:w-auto'
          >
            View Our Work
          </Link>
        </div>
      </div>
    </section>
  );
}
