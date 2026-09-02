import Image from 'next/image';

const STANDARDS = [
  {
    icon: '/assets/marketing/icon-standard-alignment.svg',
    title: 'Laser Chassis Alignment',
    description:
      'Using millimeter-perfect computerized jigs to return structural integrity to factory specifications post-collision.',
  },
  {
    icon: '/assets/marketing/icon-standard-spraybooth.svg',
    title: 'Climate-Controlled Spray Booths',
    description:
      'Downdraft technology ensures a dust-free environment for flawless, baked-on finishes that match OEM standards perfectly.',
  },
  {
    icon: '/assets/marketing/icon-standard-nct.svg',
    title: 'NCT Compliant & Insurance Approved',
    description:
      'We work directly with major insurers. All structural repairs guarantee full NCT compliance and roadworthiness.',
  },
];

export function StandardsSection() {
  return (
    <section className='grid grid-cols-1 items-center gap-12 px-6 py-20 sm:px-12 lg:grid-cols-2 lg:gap-[120px] lg:py-[120px]'>
      <div className='relative h-[400px] w-full overflow-hidden rounded-2xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] lg:h-[600px]'>
        <Image
          src='/assets/marketing/about-standards.jpg'
          alt='Vantage Autobody facility'
          fill
          className='object-cover'
        />
      </div>

      <div className='flex flex-col gap-8'>
        <div className='flex items-center gap-4 opacity-80'>
          <span className='text-xs font-semibold tracking-[1.2px] text-[#c4c7ca] uppercase'>Facility & Tech</span>
          <span className='h-px w-12 bg-[#c4c7ca]' />
        </div>

        <h2 className='font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-[-0.4px] text-[#e5e2e1] uppercase lg:text-[40px] lg:leading-[48px]'>
          Uncompromising
          <br />
          Standards
        </h2>

        <div className='flex flex-col gap-6'>
          {STANDARDS.map((item) => (
            <div key={item.title} className='flex gap-6'>
              <div className='flex size-12 shrink-0 items-center justify-center rounded-full bg-[#201f1f]'>
                <Image src={item.icon} alt='' width={22} height={22} className='size-[22px]' />
              </div>
              <div className='flex flex-col gap-2'>
                <h3 className='font-[family-name:var(--font-manrope)] text-2xl font-semibold text-[#e5e2e1]'>
                  {item.title}
                </h3>
                <p className='text-base leading-6 text-[#e6bdb8]'>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
