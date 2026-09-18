import Image from 'next/image';
import { cldUrl } from '@/lib/cloudinary/url';
import type { PartnerLogoPublic } from '@/features/partner-logos/types';

interface PartnerLogosStripProps {
  logos: PartnerLogoPublic[];
}

// Dynamic insurance/partner company logos — distinct from the static certification badges
// in `trust-strip.tsx`. Renders nothing when the admin hasn't added any logos yet.
export function PartnerLogosStrip({ logos }: PartnerLogosStripProps) {
  if (logos.length === 0) return null;

  return (
    <section className='container mx-auto bg-[#131313] px-4 py-10 sm:px-6 sm:py-14 lg:px-12'>
      <div className='mx-auto flex max-w-[1152px] flex-col gap-6 sm:gap-8'>
        <p className='text-center text-xs font-semibold tracking-[1.2px] text-neutral-400 uppercase'>
          Trusted By Leading Insurance Providers
        </p>
        <div className='flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-x-10 sm:gap-y-6'>
          {logos.map((logo) => {
            const image = (
              <Image
                src={cldUrl(logo.logoPublicId, { width: 320, height: 160, crop: 'fit' })}
                alt={logo.companyName}
                width={120}
                height={60}
                className='h-10 w-auto object-contain opacity-80 grayscale transition-[opacity,filter] duration-300 hover:opacity-100 hover:grayscale-0 sm:h-12'
              />
            );

            return logo.websiteUrl ? (
              <a
                key={logo.id}
                href={logo.websiteUrl}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={logo.companyName}
                className='shrink-0'
              >
                {image}
              </a>
            ) : (
              <span key={logo.id} className='shrink-0'>
                {image}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
