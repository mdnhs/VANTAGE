import Image from 'next/image';
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
      <div className={`${SECTION_CONTAINER} gap-6 py-10 sm:gap-8 sm:py-14`}>
        <div className='flex flex-col gap-6 border-t border-[#232328] pt-10 sm:gap-8'>
          <p className='text-center font-[family-name:var(--font-inter)] text-[11px] leading-normal tracking-[0.44px] text-[#737373] uppercase'>
            Trusted By Leading Insurance Providers
          </p>
          <div className='flex flex-wrap items-center justify-center gap-x-8 gap-y-5 sm:gap-x-12 sm:gap-y-6'>
            {logos.map((logo) => {
              if (!logo.logo) return null;
              const image = (
                <Image
                  src={logo.logo.src}
                  alt={logo.companyName}
                  width={120}
                  height={60}
                  className='h-10 w-auto object-contain opacity-60 grayscale transition-[opacity,filter] duration-300 group-hover:opacity-100 group-hover:grayscale-0 sm:h-12'
                />
              );

              return logo.websiteUrl ? (
                <a
                  key={logo.id}
                  href={logo.websiteUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={logo.companyName}
                  className='group shrink-0 rounded-[8px] focus-visible:ring-2 focus-visible:ring-[#dc2626] focus-visible:ring-offset-4 focus-visible:ring-offset-[#111113] focus-visible:outline-none'
                >
                  {image}
                </a>
              ) : (
                <span key={logo.id} className='group shrink-0'>
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
