import Image from 'next/image';
import { sizedSrc } from '@/lib/media/public-image';
import type { PartnerLogoPublic } from '@/features/partner-logos/types';
import { SECTION_BG, SECTION_CONTAINER } from '@/components/marketing/ui/landing-primitives';

interface PartnerLogosStripProps {
  logos: PartnerLogoPublic[];
}

// Dynamic insurance/partner company logos — distinct from the static certification badges
// in `trust-strip.tsx`. Renders nothing when the admin hasn't added any logos yet.
export function PartnerLogosStrip({ logos }: PartnerLogosStripProps) {
  if (logos.length === 0) return null;

  return (
    <section className={SECTION_BG.base}>
      <div className={`${SECTION_CONTAINER} gap-6 py-10 max-sm:px-5 sm:gap-8 sm:py-24 xl:py-[120px]`}>
        <div className='flex flex-col gap-6 border-t border-[#2e343e] pt-10 sm:gap-8 sm:border-t-0 sm:pt-0'>
          <p className='text-center font-site-body text-[11px] leading-normal tracking-[0.44px] text-[#7d8591] uppercase sm:text-left'>
            Trusted By Leading Insurance Providers
          </p>
          <div className='grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-start sm:gap-3'>
            {logos.map((logo) => {
              if (!logo.logo) return null;
              const image = (
                <Image
                  src={sizedSrc(logo.logo, 'w_320,h_160,c_fit')}
                  alt={logo.companyName}
                  width={120}
                  height={60}
                  className='h-8 w-auto max-w-[80%] object-contain opacity-60 grayscale transition-[opacity,filter] duration-300 group-hover:opacity-100 group-hover:grayscale-0 sm:h-10 sm:max-w-[140px]'
                />
              );

              return logo.websiteUrl ? (
                <a
                  key={logo.id}
                  href={logo.websiteUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={logo.companyName}
                  className='group flex h-16 shrink-0 items-center justify-center rounded-xl border border-[#353c47] bg-[#262b34] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-[#1b1f26] focus-visible:outline-none sm:h-[104px] sm:w-[190px] sm:rounded-2xl'
                >
                  {image}
                </a>
              ) : (
                <span
                  key={logo.id}
                  className='group flex h-16 shrink-0 items-center justify-center rounded-xl border border-[#353c47] bg-[#262b34] sm:h-[104px] sm:w-[190px] sm:rounded-2xl'
                >
                  {image}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
