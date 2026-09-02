import Image from 'next/image';
import Link from 'next/link';

const SERVICES = [
  {
    title: 'Crash Repair',
    description: 'Structural alignment and complete collision damage repair.',
    icon: '/assets/marketing/icon-crash-repair.svg',
  },
  {
    title: 'Dent Repair',
    description: 'Paintless dent removal for seamless, flawless finishes.',
    icon: '/assets/marketing/icon-dent-repair.svg',
  },
];

export function ServicesSection() {
  return (
    <section id='services' className='flex flex-col gap-16 px-6 py-20 sm:px-12 lg:py-[120px]'>
      <div className='flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end'>
        <div className='flex max-w-[672px] flex-col gap-4'>
          <div className='flex items-center gap-4'>
            <span className='h-px w-8 bg-[#ffb4ab]/50' />
            <span className='text-xs font-semibold tracking-[1.2px] text-[#ffb4ab] uppercase'>Core Capabilities</span>
          </div>
          <h2 className='font-[family-name:var(--font-manrope)] text-4xl leading-[1.2] font-bold tracking-[-1px] text-[#e5e2e1] uppercase lg:text-[40px] lg:leading-[48px]'>
            Engineered To
            <br />
            <span className='text-[#ffb4ab]'>Perfection.</span>
          </h2>
        </div>

        <Link
          href='#services'
          className='flex shrink-0 items-center gap-2 text-xs font-semibold tracking-[1.2px] text-[#e6bdb8] uppercase transition-colors hover:text-[#e5e2e1]'
        >
          Explore All Services
          <Image src='/assets/marketing/icon-arrow-explore.svg' alt='' width={13} height={13} className='size-[13px]' />
        </Link>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {SERVICES.map((service) => (
          <div
            key={service.title}
            className='group relative flex min-h-[280px] flex-col gap-6 rounded-lg border border-white/10 bg-white/4 px-8 pt-8 pb-6 backdrop-blur-md'
          >
            <div className='flex size-12 items-center justify-center rounded-full bg-[#201f1f]'>
              <Image src={service.icon} alt='' width={18} height={18} className='size-[18px]' />
            </div>

            <div className='flex flex-1 flex-col justify-end gap-2 pt-3'>
              <h3 className='font-[family-name:var(--font-manrope)] text-2xl leading-8 font-semibold text-[#e5e2e1]'>
                {service.title}
              </h3>
              <p className='text-base leading-6 text-[#e6bdb8]'>{service.description}</p>
            </div>

            <Link
              href='#services'
              className='flex items-center gap-2 pt-2 text-xs font-semibold tracking-[1.2px] text-[#ffb4ab] uppercase opacity-0 transition-opacity group-hover:opacity-100'
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
