import Image from 'next/image';
import Link from 'next/link';
import { cldUrl } from '@/lib/cloudinary/url';
import type { ServicePublic } from '@/features/services/types';

// Fallback icon for services created without an uploaded icon — matches the first icon the
// hardcoded array used to ship with, so the grid never shows a broken image.
const DEFAULT_ICON = '/assets/marketing/icon-crash-repair.svg';

// Literal class names so Tailwind's content scanner can pick them up statically.
const STAGGER_DELAY = ['motion-delay-0', 'motion-delay-150', 'motion-delay-300', 'motion-delay-450'];

interface ServicesSectionProps {
  services: ServicePublic[];
}

export function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section
      id='services'
      className='container mx-auto flex flex-col gap-12 px-4 py-16 sm:gap-16 sm:px-6 sm:py-20 md:px-12 lg:py-[120px]'
    >
      <div className='intersect-once flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end sm:gap-8 intersect:motion-preset-slide-up-sm'>
        <div className='flex max-w-[672px] flex-col gap-4'>
          <div className='flex items-center gap-4'>
            <span className='h-px w-8 bg-red-500/50' />
            <span className='text-xs font-semibold tracking-[1.2px] text-red-500 uppercase'>Core Capabilities</span>
          </div>
          <h2 className='xs:text-3xl font-[family-name:var(--font-manrope)] text-2xl leading-[1.2] font-bold tracking-[-1px] text-[#e5e2e1] uppercase sm:text-4xl lg:text-[40px] lg:leading-[48px]'>
            Engineered To
            <br />
            <span className='text-[#dc2626]'>Perfection.</span>
          </h2>
        </div>

        <Link
          href='#services'
          className='flex shrink-0 items-center gap-2 text-xs font-semibold tracking-[1.2px] text-neutral-300 uppercase transition-colors hover:text-white'
        >
          Explore All Services
          <Image src='/assets/marketing/icon-arrow-explore.svg' alt='' width={13} height={13} className='size-[13px]' />
        </Link>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {services.map((service, index) => (
          <div
            key={service.id}
            className={`group intersect-once relative flex min-h-[260px] flex-col gap-6 rounded-lg border border-white/10 bg-white/4 px-6 pt-6 pb-5 backdrop-blur-md transition-colors duration-300 hover:border-red-500/40 sm:min-h-[280px] sm:px-8 sm:pt-8 sm:pb-6 intersect:motion-preset-slide-up ${STAGGER_DELAY[index % STAGGER_DELAY.length]}`}
          >
            <div className='flex size-12 items-center justify-center rounded-full bg-[#201f1f] group-hover:motion-preset-pop'>
              <Image
                src={service.iconPublicId ? cldUrl(service.iconPublicId, { width: 36, height: 36 }) : DEFAULT_ICON}
                alt=''
                width={18}
                height={18}
                className='size-[18px]'
              />
            </div>

            <div className='flex flex-1 flex-col justify-end gap-2 pt-3'>
              <h3 className='font-[family-name:var(--font-manrope)] text-2xl leading-8 font-semibold text-[#e5e2e1]'>
                {service.name}
              </h3>
              <p className='text-base leading-6 text-neutral-400'>{service.description}</p>
            </div>

            <Link
              href='#services'
              className='flex items-center gap-2 pt-2 text-xs font-semibold tracking-[1.2px] text-red-500 uppercase opacity-0 group-hover:motion-preset-slide-up-sm group-hover:opacity-100'
            >
              Learn More
              <Image
                src='/assets/marketing/icon-arrow-learn-more.svg'
                alt=''
                width={9}
                height={9}
                className='size-[9px]'
              />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
