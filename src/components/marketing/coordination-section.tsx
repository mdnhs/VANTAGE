import Image from 'next/image';

// Literal class names so Tailwind's content scanner can pick them up statically.
const STAGGER_DELAY = ['motion-delay-0', 'motion-delay-150', 'motion-delay-300'];

const FEATURES = [
  {
    icon: '/assets/marketing/icon-insurer-communication.svg',
    title: 'Direct Insurer Communication',
    description:
      'We bypass the middleman, speaking directly with loss adjusters and assessors to approve your claim faster using specialized industry channels.',
  },
  {
    icon: '/assets/marketing/icon-courtesy-car.svg',
    title: 'Courtesy Car Coordination',
    description:
      'Never be left stranded. We arrange premium replacement vehicles immediately while yours is undergoing its comprehensive restoration.',
  },
  {
    icon: '/assets/marketing/icon-transparent-estimates.svg',
    title: 'Transparent Estimates',
    description:
      'Blueprint-level breakdowns of parts, labor, and paint. Total clarity for you and unarguable technical justification for the insurer.',
  },
];

export function CoordinationSection() {
  return (
    <section className='flex flex-col gap-16 bg-[#1c1b1b] px-6 py-20 sm:px-12 lg:py-[120px]'>
      <div className='intersect-once flex max-w-[672px] flex-col gap-4 intersect:motion-preset-slide-up-sm'>
        <h2 className='font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-[-0.4px] text-[#e5e2e1] uppercase lg:text-[40px] lg:leading-[48px]'>
          Seamless Coordination
        </h2>
        <p className='text-base leading-6 text-[#e6bdb8]'>
          Our concierge-level claims service is designed to eliminate friction at every step of the repair journey.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
        {FEATURES.map((feature, index) => (
          <div
            key={feature.title}
            className={`group intersect-once flex flex-col gap-6 rounded-xl bg-[#201f1f] p-8 shadow-md transition-colors duration-300 hover:bg-[#232221] intersect:motion-preset-slide-up ${STAGGER_DELAY[index]} ${index === 1 ? 'sm:-mt-8' : ''}`}
          >
            <div className='flex size-12 items-center justify-center rounded-full bg-[#2a2a2a] group-hover:motion-preset-pop'>
              <Image src={feature.icon} alt='' width={20} height={20} className='size-5' />
            </div>
            <h3 className='font-[family-name:var(--font-manrope)] text-2xl font-semibold text-[#e5e2e1] uppercase'>
              {feature.title}
            </h3>
            <p className='text-base leading-6 text-[#e6bdb8]'>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
