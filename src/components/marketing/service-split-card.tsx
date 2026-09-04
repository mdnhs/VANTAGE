import Image from 'next/image';
import Link from 'next/link';

const SPLIT_SERVICES = [
  {
    title: 'Dent Repair',
    description:
      'Flawless surface correction using advanced Paintless Dent Repair (PDR) techniques or traditional bodywork for severe impacts.',
    image: '/assets/marketing/service-dent-repair.jpg',
  },
  {
    title: 'Scratch Repair',
    description:
      'Precision color matching and localized clear coat blending to eradicate surface abrasions without repainting entire panels.',
    image: '/assets/marketing/service-scratch-repair.jpg',
  },
];

// Literal class names so Tailwind's content scanner can pick them up statically.
const STAGGER_DELAY = ['motion-delay-0', 'motion-delay-150'];

export function ServiceSplitCards() {
  return (
    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
      {SPLIT_SERVICES.map((service, index) => (
        <div
          key={service.title}
          className={`group intersect-once flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1c1b1b] transition-colors duration-300 hover:border-[#ffb4ab]/40 intersect:motion-preset-slide-up ${STAGGER_DELAY[index]}`}
        >
          <div className='relative h-64 w-full overflow-hidden'>
            <Image
              src={service.image}
              alt={service.title}
              fill
              className='object-cover transition-transform duration-500 group-hover:scale-105'
            />
            <div className='absolute inset-0 bg-[#131313]/20' />
          </div>

          <div className='flex flex-col items-start gap-4 p-8'>
            <h3 className='font-[family-name:var(--font-manrope)] text-2xl font-semibold text-[#e5e2e1] uppercase'>
              {service.title}
            </h3>
            <p className='text-base leading-6 text-[#e6bdb8]'>{service.description}</p>

            <Link
              href='/get-a-quote'
              className='flex items-center gap-2 pt-2 text-xs font-semibold tracking-[1.2px] text-[#ffb4ab] uppercase'
            >
              Quote Service
              <Image
                src='/assets/marketing/icon-quote-link-arrow.svg'
                alt=''
                width={8}
                height={8}
                className='size-2 transition-transform duration-300 group-hover:translate-x-1'
              />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
