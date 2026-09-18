import Image from 'next/image';

// Literal class names so Tailwind's content scanner can pick them up statically.
const STAGGER_DELAY = ['motion-delay-0', 'motion-delay-150', 'motion-delay-300'];

// Icons are fixed by position; only the title/description text is CMS-driven.
const ICONS = [
  '/assets/marketing/icon-insurer-communication.svg',
  '/assets/marketing/icon-courtesy-car.svg',
  '/assets/marketing/icon-transparent-estimates.svg',
];

interface CoordinationSectionProps {
  title: string;
  subtext: string;
  features: { title: string; description: string }[];
}

export function CoordinationSection({ title, subtext, features }: CoordinationSectionProps) {
  return (
    <section className='container mx-auto flex flex-col gap-10 bg-[#1c1b1b] px-4 py-16 sm:gap-16 sm:px-6 sm:py-20 lg:px-12 lg:py-[120px]'>
      <div className='intersect-once flex max-w-[672px] flex-col gap-4 intersect:motion-preset-slide-up-sm'>
        <h2 className='font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[#e5e2e1] uppercase sm:text-3xl lg:text-[40px] lg:leading-[48px]'>
          {title}
        </h2>
        <p className='text-base leading-6 text-neutral-400'>{subtext}</p>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className={`group intersect-once flex flex-col gap-6 rounded-xl bg-[#201f1f] p-6 shadow-md transition-colors duration-300 hover:bg-[#232221] sm:p-8 intersect:motion-preset-slide-up ${STAGGER_DELAY[index % STAGGER_DELAY.length]} ${index === 1 ? 'sm:-mt-8' : ''}`}
          >
            <div className='flex size-12 items-center justify-center rounded-full bg-[#2a2a2a] group-hover:motion-preset-pop'>
              <Image src={ICONS[index % ICONS.length]} alt='' width={20} height={20} className='size-5' />
            </div>
            <h3 className='font-[family-name:var(--font-manrope)] text-xl font-semibold text-[#e5e2e1] uppercase sm:text-2xl'>
              {feature.title}
            </h3>
            <p className='text-base leading-6 text-neutral-400'>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
